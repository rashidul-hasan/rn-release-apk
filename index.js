#!/usr/bin/env node

/**
 * rn-release-apk
 * Automates React Native release APK builds.
 * https://github.com/rashidul-hasan/rn-release-apk
 */

const { execSync, spawn } = require("child_process");
const fs   = require("fs");
const path = require("path");
const os   = require("os");

// ─── Ensure CJS-compatible deps ────────────────────────────────────────────
// chalk@5+, ora@6+, boxen@6+ are ESM-only — pin to the last CJS versions.

const DEPS = ["chalk@4", "ora@5", "boxen@5"];

(function ensureDeps() {
  const missing = DEPS.filter(dep => {
    const name = dep.replace(/@.*/, "");
    try {
      const mod = require(name);
      return typeof mod !== "function" && typeof mod !== "object";
    } catch {
      return true;
    }
  });

  if (missing.length > 0) {
    console.log(`\n  Installing: ${missing.join("  ")} ...\n`);
    execSync(`npm install --save-dev ${missing.join(" ")}`, { stdio: "inherit" });
    console.log();
  }
})();

const chalk = require("chalk");
const ora   = require("ora");
const boxen = require("boxen");

// ─── Constants ──────────────────────────────────────────────────────────────

const ANDROID_DIR = path.resolve("android");
const APK_OUT_DIR = path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "release");
const DIVIDER     = chalk.gray("─".repeat(52));

// ─── Logger ─────────────────────────────────────────────────────────────────

const log = {
  info   : (label, value) =>
    console.log(`  ${chalk.cyan("◆")} ${chalk.bold.white(label.padEnd(12))} ${chalk.gray("→")} ${chalk.yellow(value)}`),
  step   : (msg) =>
    console.log(`\n  ${chalk.bold.blue("›")} ${chalk.bold.white(msg)}`),
  success: (msg) =>
    console.log(`  ${chalk.bold.green("✔")}  ${chalk.green(msg)}`),
  warn   : (msg) =>
    console.warn(`  ${chalk.bold.yellow("⚠")}  ${chalk.yellow(msg)}`),
  error  : (msg) =>
    console.error(`  ${chalk.bold.red("✖")}  ${chalk.red(msg)}`),
  blank  : () => console.log(),
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getProjectName() {
  const pkgPath = path.resolve("package.json");
  if (!fs.existsSync(pkgPath))
    throw new Error("package.json not found — run from the project root.");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.name) throw new Error("'name' field missing in package.json.");
  return pkg.name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getDateStamp() {
  const n = new Date();
  return `${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, "0")}${String(n.getDate()).padStart(2, "0")}`;
}

function getPlatform() {
  const p = os.platform();
  return p === "win32" ? "windows" : p === "darwin" ? "macos" : "linux";
}

function getGradleCmdStr() {
  return getPlatform() === "windows"
    ? "cmd /c gradlew.bat assembleRelease"
    : "./gradlew assembleRelease";
}

function findBuiltApk(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".apk"));
  if (!files.length) return null;
  return path.join(dir, files.find(f => f.includes("release")) || files[0]);
}

function formatBytes(bytes) {
  if (bytes < 1024)    return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function openFolder(folderPath) {
  const platform = getPlatform();
  try {
    if (platform === "windows") {
      spawn("explorer", [folderPath], { detached: true, stdio: "ignore" }).unref();
    } else if (platform === "macos") {
      spawn("open", [folderPath], { detached: true, stdio: "ignore" }).unref();
    } else {
      for (const fm of ["xdg-open", "nautilus", "dolphin", "thunar", "nemo"]) {
        try {
          execSync(`which ${fm}`, { stdio: "ignore" });
          spawn(fm, [folderPath], { detached: true, stdio: "ignore" }).unref();
          return;
        } catch { /* try next */ }
      }
      log.warn("No file manager detected — open the folder manually.");
    }
  } catch (e) {
    log.warn(`Could not open folder: ${e.message}`);
  }
}

function printBanner() {
  console.log(
    boxen(
      chalk.bold.white("  React Native  ") + chalk.bold.green("APK") + chalk.bold.white(" Release Builder  "),
      { padding: 0, margin: { top: 1, bottom: 0, left: 2, right: 0 }, borderStyle: "round", borderColor: "green" }
    )
  );
  console.log();
}

function printSummary({ projectName, apkName, apkPath, duration }) {
  const size    = fs.statSync(apkPath).size;
  const elapsed = `${(duration / 1000).toFixed(1)}s`;

  const lines = [
    `${chalk.bold("Project")}    ${chalk.cyan(projectName)}`,
    `${chalk.bold("APK")}        ${chalk.green(apkName)}`,
    `${chalk.bold("Size")}       ${chalk.yellow(formatBytes(size))}`,
    `${chalk.bold("Location")}   ${chalk.gray(apkPath)}`,
    `${chalk.bold("Duration")}   ${chalk.magenta(elapsed)}`,
  ].join("\n");

  console.log(
    boxen(lines, {
      title          : chalk.bold.green(" ✔  Build Successful "),
      titleAlignment : "center",
      padding        : { top: 1, bottom: 1, left: 3, right: 3 },
      margin         : { top: 1, bottom: 1, left: 2, right: 0 },
      borderStyle    : "round",
      borderColor    : "green",
    })
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

(async function main() {
  const startTime = Date.now();

  printBanner();

  // ── 1. Validate ────────────────────────────────────────────────────────────

  log.step("Validating project structure");
  log.blank();

  const spinner = ora({ text: chalk.gray("Checking android/ folder…"), color: "cyan" }).start();

  if (!fs.existsSync(ANDROID_DIR)) {
    spinner.fail(chalk.red("android/ folder not found."));
    log.error("Run this script from your React Native project root.");
    process.exit(1);
  }

  const gradlew = path.join(ANDROID_DIR, getPlatform() === "windows" ? "gradlew.bat" : "gradlew");
  if (!fs.existsSync(gradlew)) {
    spinner.fail(chalk.red(`Gradle wrapper not found: ${gradlew}`));
    process.exit(1);
  }

  spinner.succeed(chalk.green("Project structure looks good"));

  // ── 2. Read metadata ───────────────────────────────────────────────────────

  let projectName;
  try { projectName = getProjectName(); }
  catch (e) { log.error(e.message); process.exit(1); }

  const dateStamp = getDateStamp();

  log.blank();
  console.log(`  ${DIVIDER}`);
  log.info("Project",  projectName);
  log.info("Date",     dateStamp);
  log.info("Platform", getPlatform());
  log.info("Output",   APK_OUT_DIR);
  console.log(`  ${DIVIDER}`);

  // ── 3. Build ───────────────────────────────────────────────────────────────

  log.step("Running Gradle assembleRelease");
  log.blank();
  console.log(chalk.gray("  ┌── Gradle output " + "─".repeat(34)));
  log.blank();

  const cmdStr = getGradleCmdStr();

  try {
    execSync(cmdStr, { cwd: ANDROID_DIR, stdio: "inherit" });
  } catch {
    log.blank();
    console.log(chalk.gray("  └" + "─".repeat(51)));
    log.blank();
    log.error("Gradle build failed. Review the output above.");
    process.exit(1);
  }

  log.blank();
  console.log(chalk.gray("  └── end of Gradle output " + "─".repeat(26)));
  log.blank();
  log.success("Gradle assembleRelease completed");

  // ── 4. Locate APK ─────────────────────────────────────────────────────────

  log.step("Locating built APK");
  log.blank();

  const builtApk = findBuiltApk(APK_OUT_DIR);
  if (!builtApk) {
    log.error(`No APK found in: ${APK_OUT_DIR}`);
    log.error("Ensure your release signing config is set up in build.gradle.");
    process.exit(1);
  }
  log.success(`Found: ${chalk.white(path.basename(builtApk))}`);

  // ── 5. Rename ──────────────────────────────────────────────────────────────

  log.step("Renaming APK");
  log.blank();

  const newName    = `${projectName}-${dateStamp}.apk`;
  const outputPath = path.join(APK_OUT_DIR, newName);
  const renameSpinner = ora({ text: chalk.gray(`Writing ${newName}…`), color: "cyan" }).start();

  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  fs.copyFileSync(builtApk, outputPath);

  renameSpinner.succeed(chalk.green(`Renamed → ${chalk.bold.white(newName)}`));

  // ── 6. Open folder ─────────────────────────────────────────────────────────

  log.step("Opening output folder");
  log.blank();

  const openSpinner = ora({ text: chalk.gray("Launching file explorer…"), color: "cyan" }).start();
  openFolder(APK_OUT_DIR);
  openSpinner.succeed(chalk.green("Output folder opened"));

  // ── Done ───────────────────────────────────────────────────────────────────

  printSummary({ projectName, apkName: newName, apkPath: outputPath, duration: Date.now() - startTime });
  console.log(`  ${chalk.bold.green("→")}  ${chalk.bold.white("APK is ready to share with your client!")}\n`);
})();

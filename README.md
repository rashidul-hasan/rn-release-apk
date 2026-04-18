# rn-release-apk

[![npm version](https://img.shields.io/npm/v/rn-release-apk.svg?style=flat-square&color=green)](https://www.npmjs.com/package/rn-release-apk)
[![npm downloads](https://img.shields.io/npm/dm/rn-release-apk.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/rn-release-apk)
[![license](https://img.shields.io/npm/l/rn-release-apk.svg?style=flat-square&color=orange)](./LICENSE)
[![node](https://img.shields.io/node/v/rn-release-apk.svg?style=flat-square)](https://nodejs.org)
[![platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey?style=flat-square)](https://github.com/YOUR_USERNAME/rn-release-apk)

> One command to build, rename, and deliver your React Native release APK — no scripts, no manual steps.

---

## The Problem

Every time a client asks for an APK, you do the same tedious dance:

```
cd android
./gradlew assembleRelease
cd app/build/outputs/apk/release
# find the file...
# rename it with the project name and today's date...
# open the folder...
# send to client
```

`rn-release-apk` automates all of this in a single command.

---

## What It Does

1. ✅ Validates your project structure
2. 🔨 Runs `./gradlew assembleRelease` inside the `android/` folder
3. 📦 Reads your project name from `package.json`
4. ✏️  Renames the APK to `<project-name>-<YYYYMMDD>.apk`
5. 📂 Opens the output folder in your file explorer

---

## Usage

Run from the **root of your React Native project** — no installation needed:

```bash
npx rn-release-apk
```

That's it. Your APK will be waiting at:

```
android/app/build/outputs/apk/release/<project-name>-<YYYYMMDD>.apk
```

---

## Demo

```
  ╭─────────────────────────────────────────╮
  │    React Native  APK Release Builder    │
  ╰─────────────────────────────────────────╯

  › Validating project structure

  ✔  Project structure looks good

  ◆ Project      → my-awesome-app
  ◆ Date         → 20260418
  ◆ Platform     → macos
  ◆ Output       → android/app/build/outputs/apk/release

  › Running Gradle assembleRelease

    ┌── Gradle output ──────────────────────────────────────────
    ...
    └── end of Gradle output ──────────────────────────────────

  ✔  Gradle assembleRelease completed

  › Locating built APK

  ✔  Found: app-release.apk

  › Renaming APK

  ✔  Renamed → my-awesome-app-20260418.apk

  › Opening output folder

  ✔  Output folder opened

  ╭──────────────────────────────────────────────────────╮
  │              ✔  Build Successful                     │
  │                                                      │
  │  Project    my-awesome-app                           │
  │  APK        my-awesome-app-20260418.apk              │
  │  Size       28.43 MB                                 │
  │  Location   android/app/build/outputs/apk/release/  │
  │  Duration   94.3s                                    │
  ╰──────────────────────────────────────────────────────╯

  →  APK is ready to share with your client!
```

---

## Requirements

| Requirement | Details |
|---|---|
| **Node.js** | v14 or higher |
| **React Native project** | Must have an `android/` folder with Gradle wrapper |
| **Release signing** | Your `android/app/build.gradle` must have a `signingConfig` for release builds |
| **Java / JDK** | Required by Gradle (JDK 11+ recommended) |

> **No global install needed.** `npx` downloads and runs the tool on demand.

---

## Release Signing Setup

`rn-release-apk` requires your app to be configured for signed release builds. If you haven't done this yet, follow the [official React Native guide](https://reactnative.dev/docs/signed-apk-android).

In short, your `android/app/build.gradle` should have:

```groovy
android {
    ...
    signingConfigs {
        release {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

## Platform Support

| Platform | File Explorer |
|---|---|
| **macOS** | Finder |
| **Windows** | Windows Explorer |
| **Linux** | Auto-detects: `xdg-open`, `nautilus`, `dolphin`, `thunar`, `nemo` |

---

## Optional: Install Globally

If you build APKs frequently, install it globally to skip the `npx` download each time:

```bash
npm install -g rn-release-apk
```

Then just run:

```bash
rn-release-apk
```

---

## Troubleshooting

**`android/ folder not found`**
Make sure you're running the command from your React Native project root (the folder that contains `package.json` and `android/`).

**`Gradle build failed`**
Check the Gradle output printed above the error. Common causes: missing signing config, missing keystore file, or Java not installed.

**`No APK found after build`**
Your signing config may not be set up for release builds. See the [Release Signing Setup](#release-signing-setup) section above.

**`Could not open folder automatically` (Linux)**
Install a file manager (`sudo apt install nautilus`) or navigate manually to `android/app/build/outputs/apk/release/`.

---

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push and open a Pull Request

---

## License

[MIT](./LICENSE) © Rashidul

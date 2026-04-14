#!/usr/bin/env node
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const projectPath = path.join(process.cwd(), 'example', 'android');

switch (process.platform) {
  case 'darwin':
    spawn('open', ['-a', 'Android Studio', projectPath], { stdio: 'inherit' });
    break;
  case 'linux': {
    const home = os.homedir();

    let studioSh;

    if (process.env.ANDROID_STUDIO) {
      studioSh = path.join(process.env.ANDROID_STUDIO, 'bin', 'studio.sh');
      if (!fs.existsSync(studioSh)) {
        console.error(
          `Error: Android Studio not found at ${studioSh}.\n` +
            `Check that the ANDROID_STUDIO environment variable points to your Android Studio installation directory, ` +
            `or open the project manually in Android Studio: ${projectPath}`
        );
        process.exit(1);
      }
    } else {
      const possiblePaths = [
        // Tarball install in home directory
        `${home}/android-studio/bin/studio.sh`,
        // Common system-wide installs
        '/opt/android-studio/bin/studio.sh',
        '/usr/local/android-studio/bin/studio.sh',
        // snap
        '/snap/android-studio/current/bin/studio.sh',
        // TODO @behenate Install toolbox on Linux and check which is the correct path
        // JetBrains Toolbox 2.x (flat layout)
        `${home}/.local/share/JetBrains/Toolbox/apps/android-studio/bin/studio.sh`,
        // JetBrains Toolbox 2.x (with channel subdirectory still present)
        `${home}/.local/share/JetBrains/Toolbox/apps/android-studio/ch-0/bin/studio.sh`,
        // Flatpak (user install)
        `${home}/.local/share/flatpak/app/com.google.AndroidStudio/current/active/files/extra/android-studio/bin/studio.sh`,
        // Flatpak (system install)
        '/var/lib/flatpak/app/com.google.AndroidStudio/current/active/files/extra/android-studio/bin/studio.sh',
      ];

      studioSh = possiblePaths.find((p) => fs.existsSync(p));

      if (!studioSh) {
        for (const bin of ['studio.sh', 'android-studio', 'studio']) {
          for (const lookup of [
            ['which', bin],
            ['sh', '-c', `command -v ${bin}`],
          ]) {
            const r = spawnSync(lookup[0], lookup.slice(1), { encoding: 'utf8' });
            if (r.status === 0 && r.stdout.trim()) {
              studioSh = r.stdout.trim();
              break;
            }
          }
          if (studioSh) break;
        }
      }

      if (!studioSh) {
        console.error(
          `Error: Android Studio not found.\n` +
            `Set the ANDROID_STUDIO environment variable to your Android Studio installation directory, ` +
            `or open the project manually in Android Studio: ${projectPath}`
        );
        process.exit(1);
      }
    }
    spawn(studioSh, [projectPath], { stdio: 'inherit' });
    break;
  }
  case 'win32': {
    const studioExe = process.env.ANDROID_STUDIO
      ? path.join(process.env.ANDROID_STUDIO, 'bin', 'studio64.exe')
      : path.join('C:', 'Program Files', 'Android', 'Android Studio', 'bin', 'studio64.exe');
    if (!require('fs').existsSync(studioExe)) {
      console.error(
        `Error: Android Studio not found at ${studioExe}.\n` +
          `Set the ANDROID_STUDIO environment variable to your Android Studio installation directory, ` +
          `or open the project manually in Android Studio: ${projectPath}`
      );
      process.exit(1);
    }
    spawn(studioExe, [projectPath], { stdio: 'inherit' });
    break;
  }
  default:
    console.error(`Error: Unsupported platform: ${process.platform}`);
    process.exit(1);
}

process.exit(0);

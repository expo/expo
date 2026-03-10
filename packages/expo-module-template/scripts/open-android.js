#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const projectPath = path.join(process.cwd(), 'example', 'android');

let result;
switch (process.platform) {
  case 'darwin':
    result = spawnSync('open', ['-a', 'Android Studio', projectPath], { stdio: 'inherit' });
    break;
  case 'linux': {
    const studioSh = process.env.ANDROID_STUDIO
      ? path.join(process.env.ANDROID_STUDIO, 'bin', 'studio.sh')
      : path.join(require('os').homedir(), 'android-studio', 'bin', 'studio.sh');
    if (!require('fs').existsSync(studioSh)) {
      console.error(
        `Error: Android Studio not found at ${studioSh}.\n` +
          `Set the ANDROID_STUDIO environment variable to your Android Studio installation directory, ` +
          `or open the project manually in Android Studio: ${projectPath}`
      );
      process.exit(1);
    }
    result = spawnSync(studioSh, [projectPath], { stdio: 'inherit' });
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
    result = spawnSync(studioExe, [projectPath], { stdio: 'inherit' });
    break;
  }
  default:
    console.error(`Error: Unsupported platform: ${process.platform}`);
    process.exit(1);
}

process.exit(result.status ?? 0);

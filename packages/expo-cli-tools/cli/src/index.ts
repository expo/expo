import chalk from 'chalk';
import { execSync } from 'child_process';
import { cliExtension, ExpoCliOutput, NoArgs } from 'expo-cli-extensions';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { takeScreenshot } from './screenshot';

cliExtension<{
  outdated: NoArgs;
  upgrade: NoArgs;
  doctor: NoArgs;
  take_screenshot: NoArgs;
  clear_watchman: NoArgs;
  list_apps: NoArgs;
}>(async (cmd, args, apps): Promise<ExpoCliOutput> => {
  // Validate command
  if (cmd === 'outdated') {
    try {
      console.log(`Running: npx expo install --check`);
      console.log(execSync('npm_config_yes=true npx expo install --check', { encoding: 'utf8' }));
    } catch (error: any) {
      throw new Error('An error occured running the command\n' + error.toString());
    }
  } else if (cmd === 'upgrade') {
    try {
      console.log(`Running: npx expo install expo@latest`);
      console.log(
        execSync('npm_config_yes=true npx expo install expo@latest', { encoding: 'utf8' })
      );
    } catch (error: any) {
      throw new Error('An error occured running the command\n' + error.toString());
    }
  } else if (cmd === 'doctor') {
    try {
      console.log(`Running: npx expo-doctor`, process.cwd());
      console.log(
        execSync('npx expo-doctor', {
          encoding: 'utf8',
          env: { ...process.env, npm_config_yes: 'true' },
        })
      );
    } catch (error: any) {
      throw new Error('An error occured running the command\n' + error.toString());
    }
  } else if (cmd === 'take_screenshot') {
    try {
      if (apps.length === 0) {
        throw new Error(
          'No apps connected to the dev server. Please connect an app to use this command.'
        );
      }
      const screenshots = apps.map((app) => ({ app, filename: takeScreenshot(app) }));

      if (args.source === 'mcp') {
        // If we're running in MCP mode, we can send the screenshot back to the MCP server
        return screenshots
          .map(({ app, filename }) => {
            const fileBuffer = fs.readFileSync(filename);
            const base64 = fileBuffer.toString('base64');
            return [
              { type: 'text', text: app.deviceName },
              { type: 'image', data: base64, mimeType: 'image/png' },
            ];
          })
          .flat() as ExpoCliOutput;
      } else {
        // We'll just print the path to the screenshot
        return screenshots
          .map(({ app, filename }) => {
            return [{ type: 'text', text: app.deviceName, url: filename }];
          })
          .flat() as ExpoCliOutput;
      }
    } catch (error: any) {
      throw new Error('An error occured connecting to the app:\n' + error.toString());
    }
  } else if (cmd === 'clear_watchman') {
    const pwd = process.cwd();
    const command = `watchman watch-del '${pwd}' ; watchman watch-project '${pwd}'`;
    console.log('Running:', command);
    execSync(command, { stdio: 'inherit' });
  } else if (cmd === 'list_apps') {
    console.log('Connected apps:');
    console.log(JSON.stringify(apps, null, 2));
  } else {
    return Promise.reject(new Error(`The command ${cmd} is an unknown command for this tool.`));
  }
});

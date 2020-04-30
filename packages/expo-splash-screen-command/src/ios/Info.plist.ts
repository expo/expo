import fs from 'fs-extra';
import path from 'path';

import StateManager from '../StateManager';
import { replace, insert } from '../string-helpers';

const INFO_PLIST_FILE_PATH = 'Info.plist';

/**
 * Configures [INFO_PLIST] to show [STORYBOARD] filename as Splash/Launch Screen.
 */
export default async function configureInfoPlist(iosProjectPath: string) {
  const filePath = path.resolve(iosProjectPath, INFO_PLIST_FILE_PATH);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const { state: newContent } = new StateManager<string, boolean>(fileContent)
    .applyAction(content => {
      const [succeeded, newContent] = replace(content, {
        replaceContent: '<string>SplashScreen</string>',
        replacePattern: /(?<=<key>UILaunchStoryboardName<\/key>(.|\n)*?)<string>.*?<\/string>/m,
      });
      return [newContent, 'replaced', succeeded];
    })
    .applyAction((content, { replaced }) => {
      if (replaced) {
        return [content, 'inserted', false];
      }
      const [succeeded, newContent] = insert(
        content,
        {
          insertContent: `  <key>UILaunchStoryboardName</key>\n  <string>SplashScreen</string>\n`,
          insertPattern: /<\/dict>/gm,
        },
        true
      );
      return [newContent, 'inserted', succeeded];
    });
  await fs.writeFile(filePath, newContent);
}

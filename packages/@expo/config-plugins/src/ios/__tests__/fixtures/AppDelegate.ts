import fs from 'fs';
import path from 'path';

export const DefaultAppDelegate = fs.readFileSync(
  path.join(
    __dirname,
    '../../../../../../../templates/expo-template-bare-minimum/ios/HelloWorld/AppDelegate.mm'
  ),
  'utf8'
);

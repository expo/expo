import fs from 'fs';
import path from 'path';

export const PodfileBasic = fs.readFileSync(
  path.join(__dirname, '../../../../../../../templates/expo-template-bare-minimum/ios/Podfile'),
  'utf8'
);

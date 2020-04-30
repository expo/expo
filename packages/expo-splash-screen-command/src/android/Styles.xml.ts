import path from 'path';
import { Element } from 'xml-js';

import { readXmlFile, writeXmlFile, mergeXmlElements } from '../xml-manipulation';

const STYLES_XML_FILE_PATH = './res/values/styles.xml';

function configureStyle(xml: Element): Element {
  const result = mergeXmlElements(xml, {
    elements: [
      {
        name: 'resources',
        elements: [
          {
            name: 'style',
            attributes: {
              name: 'Theme.App.SplashScreen',
              parent: 'Theme.AppCompat.Light.NoActionBar',
            },
            elements: [
              {
                idx: 0,
                comment: ` Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually `,
              },
              {
                idx: 1,
                name: 'item',
                attributes: {
                  name: 'android:windowBackground',
                },
                elements: [
                  {
                    text: '@drawable/splashscreen',
                  },
                ],
              },
              {
                comment: ` Customize your splash screen theme here `,
              },
            ],
          },
        ],
      },
    ],
  });
  return result;
}

/**
 * @param androidMainPath Path to the main directory containing code and resources in Android project. In general that would be `android/app/src/main`.
 */
export default async function configureStylesXml(androidMainPath: string) {
  const filePath = path.resolve(androidMainPath, STYLES_XML_FILE_PATH);
  const xmlContent = await readXmlFile(filePath);
  const configuredXmlContent = configureStyle(xmlContent);
  await writeXmlFile(filePath, configuredXmlContent);
}

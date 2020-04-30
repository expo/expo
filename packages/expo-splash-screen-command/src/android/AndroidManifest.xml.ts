import path from 'path';
import { Element } from 'xml-js';

import { readXmlFile, writeXmlFile, mergeXmlElements } from '../xml-manipulation';

const ANDROID_MANIFEST_XML_FILE_PATH = './AndroidManifest.xml';

function configureAndroidManifest(xml: Element): Element {
  const result = mergeXmlElements(xml, {
    elements: [
      {
        name: 'manifest',
        elements: [
          {
            name: 'application',
            attributes: {
              'android:name': '.MainApplication',
            },
            elements: [
              {
                name: 'activity',
                attributes: {
                  'android:name': '.MainActivity',
                  'android:theme': {
                    newValue: '@style/Theme.App.SplashScreen',
                  },
                },
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
export default async function configureAndroidManifestXml(androidMainPath: string) {
  const filePath = path.resolve(androidMainPath, ANDROID_MANIFEST_XML_FILE_PATH);
  const xmlContent = await readXmlFile(filePath);
  const configuredXmlContent = configureAndroidManifest(xmlContent);
  await writeXmlFile(filePath, configuredXmlContent);
}

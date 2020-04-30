import path from 'path';
import { Element } from 'xml-js';

import { ResizeMode } from '../constants';
import {
  mergeXmlElements,
  readXmlFile,
  writeXmlFile,
  ExpectedElementsType,
  ExpectedElementType,
} from '../xml-manipulation';

const DRAWABLE_XML_FILE_PATH = `./res/drawable/splashscreen.xml`;

function configureDrawable(xml: Element, resizeMode: ResizeMode): Element {
  const expected: ExpectedElementsType = {
    elements: [
      {
        idx: 0,
        comment: `\n  This file was created by 'expo-splash-screen' and some of it's content shouldn't be modified by hand\n`,
      },
      {
        name: 'layer-list',
        attributes: {
          'xmlns:android': 'http://schemas.android.com/apk/res/android',
        },
        elements: {
          newValue: ([
            {
              name: 'item',
              attributes: {
                'android:drawable': '@color/splashscreen_background',
              },
            },
          ] as ExpectedElementType[]).concat(
            resizeMode !== ResizeMode.NATIVE
              ? []
              : [
                  {
                    name: 'item',
                    elements: [
                      {
                        name: 'bitmap',
                        attributes: {
                          'android:gravity': 'center',
                          'android:src': '@drawable/splashscreen_image',
                        },
                      },
                    ],
                  },
                ]
          ),
        },
      },
    ],
  };
  const result = mergeXmlElements(xml, expected);
  return result;
}

/**
 * @param androidMainPath Path to the main directory containing code and resources in Android project. In general that would be `android/app/src/main`.
 * @param resizeMode
 */
export default async function configureDrawableXml(
  androidMainPath: string,
  resizeMode: ResizeMode
) {
  const filePath = path.resolve(androidMainPath, DRAWABLE_XML_FILE_PATH);
  const xmlContent = await readXmlFile(filePath);
  const configuredXmlContent = configureDrawable(xmlContent, resizeMode);
  await writeXmlFile(filePath, configuredXmlContent);
}

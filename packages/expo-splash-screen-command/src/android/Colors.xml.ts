import colorString, { ColorDescriptor } from 'color-string';
import path from 'path';
import { Element } from 'xml-js';

import { readXmlFile, writeXmlFile, mergeXmlElements } from '../xml-manipulation';

const COLORS_XML_FILE_PATH = './res/values/colors.xml';

function configureBackgroundColor(xml: Element, backgroundColor: ColorDescriptor): Element {
  const result = mergeXmlElements(xml, {
    elements: [
      {
        name: 'resources',
        elements: [
          {
            idx: 0,
            comment: ` Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually `,
          },
          {
            idx: 1,
            name: 'color',
            attributes: {
              name: 'splashscreen_background',
            },
            elements: [
              {
                text: colorString.to.hex(backgroundColor.value),
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
 * @param backgroundColor
 */
export default async function configureColorsXml(
  androidMainPath: string,
  backgroundColor: ColorDescriptor
) {
  const filePath = path.resolve(androidMainPath, COLORS_XML_FILE_PATH);
  const xmlContent = await readXmlFile(filePath);
  const configuredXmlContent = configureBackgroundColor(xmlContent, backgroundColor);
  await writeXmlFile(filePath, configuredXmlContent);
}

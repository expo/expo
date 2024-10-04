// Forked from `@expo/prebuild-config`, because its not exposed as public API or through a correct dependency chain
// See: https://github.com/expo/expo/blob/80ee356c2c90d6498b45c95214ed7be169d63f75/packages/%40expo/prebuild-config/src/plugins/icons/AssetContents.ts
import fs from 'node:fs/promises';
import path from 'node:path';

type ContentsJsonImageScale = '1x' | '2x' | '3x';
type ContentsJsonImageIdiom = 'iphone' | 'ipad' | 'watchos' | 'ios' | 'ios-marketing' | 'universal';
type ContentsJsonImageAppearance = {
  appearance: 'luminosity';
  value: 'dark';
};

export interface ContentsJsonImage {
  appearances?: ContentsJsonImageAppearance[];
  idiom: ContentsJsonImageIdiom;
  size?: string;
  scale?: ContentsJsonImageScale;
  filename?: string;
  platform?: ContentsJsonImageIdiom;
}

export interface ContentsJson {
  images: ContentsJsonImage[];
  info: {
    version: number;
    author: string;
  };
}

/**
 * Writes the Config.json which is used to assign images to their respective platform, dpi, and idiom.
 *
 * @param directory path to add the Contents.json to.
 * @param contents image json data
 */
export async function writeContentsJsonAsync(
  directory: string,
  { images }: Pick<ContentsJson, 'images'>
) {
  const data = {
    images,
    info: {
      version: 1,
      // common practice is for the tool that generated the icons to be the "author"
      author: 'expo',
    },
  };

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'Contents.json'), JSON.stringify(data, null, 2));
}

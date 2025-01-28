import fs from 'fs-extra';
import { join } from 'path';

export type ContentsJsonImageIdiom =
  | 'iphone'
  | 'ipad'
  | 'watchos'
  | 'ios'
  | 'ios-marketing'
  | 'universal';

export type ContentsJsonImageAppearanceLuminosityType = 'light' | 'dark' | 'tinted';

export type ContentsJsonAppearance = {
  appearance: 'luminosity';
  value: ContentsJsonImageAppearanceLuminosityType;
};

export type ContentsJsonImageScale = '1x' | '2x' | '3x';

export interface ContentsJsonImage {
  appearances?: ContentsJsonAppearance[];
  idiom: ContentsJsonImageIdiom;
  size?: string;
  scale?: ContentsJsonImageScale;
  filename?: string;
  platform?: ContentsJsonImageIdiom;
}

export interface ContentsJsonColor {
  appearances?: ContentsJsonAppearance[];
  idiom: ContentsJsonImageIdiom;
  color: {
    'color-space': 'srgb';
    components: {
      alpha: string;
      blue: string;
      green: string;
      red: string;
    };
  };
}

export interface ContentsJson {
  images: ContentsJsonImage[];
  colors: ContentsJsonColor[];
  info: {
    version: number;
    author: string;
  };
}

export function createContentsJsonItem(item: ContentsJsonImage): ContentsJsonImage {
  return item;
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
): Promise<void> {
  await fs.ensureDir(directory);

  await fs.writeFile(
    join(directory, 'Contents.json'),
    JSON.stringify(
      {
        images,
        info: {
          version: 1,
          // common practice is for the tool that generated the icons to be the "author"
          author: 'expo',
        },
      },
      null,
      2
    )
  );
}

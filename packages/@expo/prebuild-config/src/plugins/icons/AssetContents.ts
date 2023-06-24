import fs from 'fs-extra';
import { join } from 'path';

export type ContentsJsonImageIdiom =
  | 'iphone'
  | 'ipad'
  | 'watchos'
  | 'ios'
  | 'reality'
  | 'ios-marketing'
  | 'universal';

export type ContentsJsonImageAppearance = {
  appearance: 'luminosity';
  value: 'dark';
};

export type ContentsJsonImageScale = '1x' | '2x' | '3x';

export interface ContentsJsonImage {
  appearances?: ContentsJsonImageAppearance[];
  idiom: ContentsJsonImageIdiom;
  size?: string;
  scale?: ContentsJsonImageScale;
  filename?: string;
  platform?: ContentsJsonImageIdiom;
}

export interface ContentsJsonLayer {
  filename: string;
}

export interface ContentsJson {
  images?: ContentsJsonImage[];
  layers?: ContentsJsonLayer[];
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
  { images, layers }: Partial<Omit<ContentsJson, 'info'>> = {}
): Promise<void> {
  await fs.ensureDir(directory);

  const data: Partial<ContentsJson> = {
    info: {
      version: 1,
      // common practice is for the tool that generated the icons to be the "author"
      author: 'expo',
    },
  };

  if (images) {
    data.images = images;
  }
  if (layers) {
    data.layers = layers;
  }

  await fs.writeFile(join(directory, 'Contents.json'), JSON.stringify(data, null, 2));
}

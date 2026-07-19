import type { RenderToImageResult } from '../src/FontUtils.types';

export type RenderToImageOptions = any;

export async function renderToImageAsync(
  glyphs: string,
  options: RenderToImageOptions
): Promise<RenderToImageResult> {
  return {
    width: 0,
    height: 0,
    scale: 1,
    uri: '',
  };
}

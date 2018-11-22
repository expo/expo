import { NativeAR } from '../NativeAR';

type DetectionImage = {
  uri: string;
  width: number;
  name?: string;
};

/**
 * Instructs AR to look for provided images
 * @param images 
 */
export async function setDetectionImagesAsync(images: { [name: string]: DetectionImage }): Promise<void> {
  return NativeAR.setDetectionImagesAsync(images);
}
import Jimp from 'jimp-compact';

export async function resizeImage(imagePath: string, resizingFactor: number): Promise<void> {
  if (resizingFactor === 1) {
    return;
  }

  const image = await Jimp.read(imagePath);
  const newWidth = Math.round(image.bitmap.width * resizingFactor);
  const newHeight = Math.round(image.bitmap.height * resizingFactor);

  const resizedImage = image.resize(newWidth, newHeight);
  await resizedImage.write(imagePath);
}

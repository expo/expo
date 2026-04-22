// This API route imports an image asset to test that assets are collected
// during API route export.
import testImage from '../../../../assets/icon.png';

export function GET(): Response {
  // The testImage should be a number (the asset's module ID) or an object with metadata
  return Response.json({
    hasAsset: testImage != null,
    assetType: typeof testImage,
  });
}

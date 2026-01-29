// Import asset - will be bundled and available at runtime
import iconAsset from '../../../../assets/icon.png';

export async function GET(req: Request) {
  // Test that the imported asset can be coerced to a URL path
  const assetType = typeof iconAsset;
  const assetValue = String(iconAsset);

  // Try to fetch the asset to verify it's accessible
  let fetchStatus = 'not attempted';
  let fetchError = null;

  try {
    const assetUrl = new URL(iconAsset, req.url).toString();
    const response = await fetch(assetUrl);
    fetchStatus = response.ok ? 'success' : `failed: ${response.status}`;
  } catch (error) {
    fetchError = String(error);
    fetchStatus = 'error';
  }

  return Response.json({
    assetType,
    assetValue,
    hasAssetPath: assetValue.length > 0,
    fetchStatus,
    fetchError,
  });
}

import Sharing from './ExpoSharing';

interface ShareParams {
  mimeType?: string
  UTI?: string
}
export async function shareAsync(
  url: string,
  params: ShareParams = {}
): Promise<any> {
  return Sharing.shareAsync(url, params)
}
import Sharing from './ExpoSharing';

type ShareOptions = {
  mimeType?: string
  UTI?: string
}

export async function shareAsync(
  url: string,
  options: ShareOptions = {}
): Promise<boolean> {
  return await Sharing.shareAsync(url, options)
}
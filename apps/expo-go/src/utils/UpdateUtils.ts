import { Linking } from 'react-native';

import * as Kernel from '../kernel/Kernel';
import * as UrlUtils from '../utils/UrlUtils';

export function isUpdateCompatibleWithThisExpoGo({
  expoGoSDKVersion,
}: {
  expoGoSDKVersion?: string | null | undefined;
}): boolean {
  return !!expoGoSDKVersion && Kernel.sdkVersionsArray.includes(expoGoSDKVersion);
}

export function openUpdateManifestPermalink({
  manifestPermalink,
}: {
  manifestPermalink: string;
}): void {
  Linking.openURL(UrlUtils.toExp(UrlUtils.normalizeUrl(manifestPermalink)));
}

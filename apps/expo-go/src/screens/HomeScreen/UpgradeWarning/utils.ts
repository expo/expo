import Environment from 'src/utils/Environment';

const SDK_VERSION_REGEXP = new RegExp(/\b(\d*)\.0\.0/);

type SdkVersionFromApiType = {
  androidClientUrl?: string;
  androidClientVersion?: string;
  expoVersion?: string;
  facebookReactNativeVersion?: string;
  facebookReactVersion?: string;
  iosClientUrl?: string;
  iosClientVersion?: string;
  releaseNoteUrl?: string;
};

type SdkVersionTypeWithSdkType = SdkVersionFromApiType & {
  sdk: string;
  isLatest?: boolean;
  isBeta?: boolean;
};

type VersionsApiResponseType = {
  sdkVersions: Record<string, SdkVersionFromApiType>;
};

// Show the message if current SDK !== latest SDK AND the latest SDK is yet to be released
export async function shouldShowUpgradeWarningAsync(): Promise<{
  shouldShow: boolean;
  betaSdkVersion?: string;
}> {
  const result = await fetch('https://api.expo.dev/v2/versions');

  try {
    const data: VersionsApiResponseType = await result.json();

    const publishedVersions = Object.keys(data.sdkVersions)
      .map((sdk) => ({
        ...data.sdkVersions[sdk],
        sdk: sdk.match(SDK_VERSION_REGEXP)?.[1],
      }))
      .filter((version) => !!version.sdk) as SdkVersionTypeWithSdkType[];

    const lastVersion = publishedVersions[publishedVersions.length - 1];
    const currentIsOutdated = Environment.supportedSdksString !== lastVersion.sdk;
    const latestIsBeta = !lastVersion.releaseNoteUrl;

    return {
      shouldShow: Boolean(currentIsOutdated && latestIsBeta),
      betaSdkVersion: lastVersion.sdk,
    };
  } catch {}

  return {
    shouldShow: false,
  };
}

import resolveFrom from 'resolve-from';

type BundledNativeModules = Record<string, string>;

export async function getNativeModuleVersionsAsync(
  projectRoot: string,
  sdkVersion: string
): Promise<BundledNativeModules> {
  if (sdkVersion !== 'UNVERSIONED') {
    try {
      return await fetchNativeModuleVersionsAsync(sdkVersion);
    } catch {}
  }

  return await readLocalBundledNativeModulesAsync(projectRoot);
}

async function fetchNativeModuleVersionsAsync(sdkVersion: string): Promise<BundledNativeModules> {
  const url = new URL(`/v2/sdks/${sdkVersion}/native-modules`, getExpoApiBaseUrl()).toString();
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unexpected response from Expo API: ${response.statusText}`);
  }

  const json: any = await response.json();
  const data: { npmPackage: string; versionRange: string }[] = json?.data;
  if (!data?.length) {
    throw new Error('The bundled native module list from the Expo API is empty');
  }

  return Object.fromEntries(data.map((entry) => [entry.npmPackage, entry.versionRange]));
}

async function readLocalBundledNativeModulesAsync(
  projectRoot: string
): Promise<BundledNativeModules> {
  const bundledNativeModulesPath = resolveFrom.silent(
    projectRoot,
    'expo/bundledNativeModules.json'
  );
  if (!bundledNativeModulesPath) {
    throw new Error(
      'The dependency map expo/bundledNativeModules.json cannot be found. Ensure you have the "expo" package installed in your project.'
    );
  }
  return require(bundledNativeModulesPath);
}

function getExpoApiBaseUrl(): string {
  if (process.env.EXPO_STAGING) {
    return 'https://staging-api.expo.dev';
  } else if (process.env.EXPO_LOCAL) {
    return 'http://127.0.0.1:3000';
  } else {
    return 'https://api.expo.dev';
  }
}

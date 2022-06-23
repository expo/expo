import { ExpoConfig } from '@expo/config-types';

import { createInfoPlistPluginWithPropertyGuard } from '../plugins/ios-plugins';
import { InfoPlist, URLScheme } from './IosConfig.types';

export const withScheme = createInfoPlistPluginWithPropertyGuard(
  setScheme,
  {
    infoPlistProperty: 'CFBundleURLTypes',
    expoConfigProperty: 'scheme',
  },
  'withScheme'
);

export function getScheme(config: { scheme?: string | string[] }): string[] {
  if (Array.isArray(config.scheme)) {
    const validate = (value: any): value is string => {
      return typeof value === 'string';
    };
    return config.scheme.filter<string>(validate);
  } else if (typeof config.scheme === 'string') {
    return [config.scheme];
  }
  return [];
}

export function setScheme(
  config: Partial<Pick<ExpoConfig, 'scheme' | 'ios'>>,
  infoPlist: InfoPlist
): InfoPlist {
  const scheme = [
    ...getScheme(config),
    // @ts-ignore: TODO: ios.scheme is an unreleased -- harder to add to turtle v1.
    ...getScheme(config.ios ?? {}),
  ];
  // Add the bundle identifier to the list of schemes for easier Google auth and parity with Turtle v1.
  if (config.ios?.bundleIdentifier) {
    scheme.push(config.ios.bundleIdentifier);
  }
  if (scheme.length === 0) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    CFBundleURLTypes: [{ CFBundleURLSchemes: scheme }],
  };
}

export function appendScheme(scheme: string | null, infoPlist: InfoPlist): InfoPlist {
  if (!scheme) {
    return infoPlist;
  }

  const existingSchemes = infoPlist.CFBundleURLTypes ?? [];
  if (existingSchemes.some(({ CFBundleURLSchemes }) => CFBundleURLSchemes.includes(scheme))) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    CFBundleURLTypes: [
      ...existingSchemes,
      {
        CFBundleURLSchemes: [scheme],
      },
    ],
  };
}

export function removeScheme(scheme: string | null, infoPlist: InfoPlist): InfoPlist {
  if (!scheme) {
    return infoPlist;
  }

  // No need to remove if we don't have any
  if (!infoPlist.CFBundleURLTypes) {
    return infoPlist;
  }

  infoPlist.CFBundleURLTypes = infoPlist.CFBundleURLTypes.map(bundleUrlType => {
    const index = bundleUrlType.CFBundleURLSchemes.indexOf(scheme);
    if (index > -1) {
      bundleUrlType.CFBundleURLSchemes.splice(index, 1);
      if (bundleUrlType.CFBundleURLSchemes.length === 0) {
        return undefined;
      }
    }
    return bundleUrlType;
  }).filter(Boolean) as URLScheme[];

  return infoPlist;
}

export function hasScheme(scheme: string, infoPlist: InfoPlist): boolean {
  const existingSchemes = infoPlist.CFBundleURLTypes;

  if (!Array.isArray(existingSchemes)) return false;

  return existingSchemes.some(({ CFBundleURLSchemes: schemes }: any) =>
    Array.isArray(schemes) ? schemes.includes(scheme) : false
  );
}

export function getSchemesFromPlist(infoPlist: InfoPlist): string[] {
  if (Array.isArray(infoPlist.CFBundleURLTypes)) {
    return infoPlist.CFBundleURLTypes.reduce<string[]>((schemes, { CFBundleURLSchemes }) => {
      if (Array.isArray(CFBundleURLSchemes)) {
        return [...schemes, ...CFBundleURLSchemes];
      }
      return schemes;
    }, []);
  }
  return [];
}

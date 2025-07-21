import Debug from 'debug';
import path from 'path';

import { BaseModOptions, withBaseMod } from './withMod';
import {
  ConfigPlugin,
  ExportedConfig,
  ExportedConfigWithProps,
  ModPlatform,
} from '../Plugin.types';

const debug = Debug('expo:config-plugins:base-mods');

export type ForwardedBaseModOptions = Partial<
  Pick<BaseModOptions, 'saveToInternal' | 'skipEmptyMod'>
>;

export type BaseModProviderMethods<
  ModType,
  Props extends ForwardedBaseModOptions = ForwardedBaseModOptions,
> = {
  getFilePath: (config: ExportedConfigWithProps<ModType>, props: Props) => Promise<string> | string;
  read: (
    filePath: string,
    config: ExportedConfigWithProps<ModType>,
    props: Props
  ) => Promise<ModType> | ModType;
  write: (
    filePath: string,
    config: ExportedConfigWithProps<ModType>,
    props: Props
  ) => Promise<void> | void;
  /**
   * If the mod supports introspection, and avoids making any filesystem modifications during compilation.
   * By enabling, this mod, and all of its descendants will be run in introspection mode.
   * This should only be used for static files like JSON or XML, and not for application files that require regexes,
   * or complex static files that require other files to be generated like Xcode `.pbxproj`.
   */
  isIntrospective?: boolean;
};

export type CreateBaseModProps<
  ModType,
  Props extends ForwardedBaseModOptions = ForwardedBaseModOptions,
> = {
  methodName: string;
  platform: ModPlatform;
  modName: string;
} & BaseModProviderMethods<ModType, Props>;

export function createBaseMod<
  ModType,
  Props extends ForwardedBaseModOptions = ForwardedBaseModOptions,
>({
  methodName,
  platform,
  modName,
  getFilePath,
  read,
  write,
  isIntrospective,
}: CreateBaseModProps<ModType, Props>): ConfigPlugin<Props | void> {
  const withUnknown: ConfigPlugin<Props | void> = (config, _props) => {
    const props = _props || ({} as Props);
    return withBaseMod<ModType>(config, {
      platform,
      mod: modName,
      skipEmptyMod: props.skipEmptyMod ?? true,
      saveToInternal: props.saveToInternal ?? false,
      isProvider: true,
      isIntrospective,
      async action({ modRequest: { nextMod, templateProjectRoot, ...modRequest }, ...config }) {
        try {
          let results: ExportedConfigWithProps<ModType> = {
            ...config,
            modRequest,
          };

          const filePath = await getFilePath(results, props);
          let inputFilePath = filePath;

          // Change the input file path for resetting the provider.
          if (templateProjectRoot) {
            inputFilePath = await getFilePath(
              {
                ...results,
                modRequest: {
                  ...results.modRequest,
                  // Calculate new paths relative to the replacement template root.
                  platformProjectRoot: path.join(templateProjectRoot, results.modRequest.platform),
                  projectRoot: templateProjectRoot,
                },
              },
              props
            );
          }

          if (inputFilePath === filePath) {
            debug(`mods.${platform}.${modName}: file path: ${filePath || '[skipped]'}`);
          } else {
            debug(`mods.${platform}.${modName}: file path input: ${inputFilePath || '[skipped]'}`);
            debug(`mods.${platform}.${modName}: file path output: ${filePath || '[skipped]'}`);
          }

          const modResults = await read(inputFilePath, results, props);

          results = await nextMod!({
            ...results,
            modResults,
            modRequest,
          });

          assertModResults(results, modRequest.platform, modRequest.modName);

          await write(filePath, results, props);
          return results;
        } catch (error: any) {
          error.message = `[${platform}.${modName}]: ${methodName}: ${error.message}`;
          throw error;
        }
      },
    });
  };

  if (methodName) {
    Object.defineProperty(withUnknown, 'name', {
      value: methodName,
    });
  }

  return withUnknown;
}

export function assertModResults(results: any, platformName: string, modName: string) {
  // If the results came from a mod, they'd be in the form of [config, data].
  // Ensure the results are an array and omit the data since it should've been written by a data provider plugin.
  const ensuredResults = results;

  // Sanity check to help locate non compliant mods.
  if (!ensuredResults || typeof ensuredResults !== 'object' || !ensuredResults?.mods) {
    throw new Error(
      `Mod \`mods.${platformName}.${modName}\` evaluated to an object that is not a valid project config. Instead got: ${JSON.stringify(
        ensuredResults
      )}`
    );
  }
  return ensuredResults;
}

function upperFirst(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function createPlatformBaseMod<
  ModType,
  Props extends ForwardedBaseModOptions = ForwardedBaseModOptions,
>({ modName, ...props }: Omit<CreateBaseModProps<ModType, Props>, 'methodName'>) {
  // Generate the function name to ensure it's uniform and also to improve stack traces.
  const methodName = `with${upperFirst(props.platform)}${upperFirst(modName)}BaseMod`;
  return createBaseMod<ModType, Props>({
    methodName,
    modName,
    ...props,
  });
}

/** A TS wrapper for creating provides */
export function provider<ModType, Props extends ForwardedBaseModOptions = ForwardedBaseModOptions>(
  props: BaseModProviderMethods<ModType, Props>
) {
  return props;
}

/** Plugin to create and append base mods from file providers */
export function withGeneratedBaseMods<ModName extends string>(
  config: ExportedConfig,
  {
    platform,
    providers,
    ...props
  }: ForwardedBaseModOptions & {
    /** Officially supports `'ios' | 'android'` (`ModPlatform`). Arbitrary strings are supported for adding out-of-tree platforms. */
    platform: ModPlatform & string;
    providers: Partial<Record<ModName, BaseModProviderMethods<any, any>>>;
  }
): ExportedConfig {
  return Object.entries(providers).reduce((config, [modName, value]) => {
    const baseMod = createPlatformBaseMod({
      platform,
      modName,
      ...(value as any),
    });
    return baseMod(config, props);
  }, config);
}

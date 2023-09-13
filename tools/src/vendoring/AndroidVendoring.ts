import { copyVendoredFilesAsync } from './common';
import { VendoringModuleConfig } from './types';
import { searchFilesAsync } from '../Utils';

export async function vendorAsync(
  sourceDirectory: string,
  targetDirectory: string,
  config: VendoringModuleConfig['android'] = {}
): Promise<void> {
  // Get a list of source files for Android. Usually we'll just fall back to `android` directory.
  const files = await searchFilesAsync(sourceDirectory, config.includeFiles ?? 'android/**', {
    ignore: config.excludeFiles,
  });

  await copyVendoredFilesAsync(files, {
    sourceDirectory,
    targetDirectory,
    transforms: config?.transforms ?? {},
  });

  await config.postCopyFilesHookAsync?.(sourceDirectory, targetDirectory);
}

import fs from 'fs';
import path from 'path';
import { z } from 'zod';

import type { Device } from '../../start/platforms/android/adb';
import { DeviceABI, getDeviceABIsAsync } from '../../start/platforms/android/adb';
import { debugEvent } from '../events';

const apkMetadataSchema = z.object({
  elements: z.array(
    z.object({
      outputFile: z.string(),
      filters: z.array(z.object({ filterType: z.string(), value: z.string() })).default([]),
    })
  ),
});

export async function resolveInstallApkPathAsync(
  device: Pick<Device, 'name' | 'pid'>,
  artifactPaths: readonly string[]
): Promise<string | null> {
  const candidates = new Set(artifactPaths);
  const elements = [];

  for (const directory of new Set(
    artifactPaths.map((artifactPath) => path.dirname(artifactPath))
  )) {
    debugEvent('android:apk_search', { directory });
    try {
      const metadata = apkMetadataSchema.parse(
        JSON.parse(fs.readFileSync(path.join(directory, 'output-metadata.json'), 'utf8'))
      );
      for (const element of metadata.elements) {
        const outputPath = path.resolve(directory, element.outputFile);
        debugEvent('android:apk_check', { path: outputPath });
        if (candidates.has(outputPath) && fs.existsSync(outputPath)) {
          elements.push({ outputPath, filters: element.filters });
        }
      }
    } catch (error) {
      debugEvent('android:apk_metadata_parse_failed', { error: debugEvent.error(error as Error) });
      return null;
    }
  }

  const availableCPUs = await getDeviceABIsAsync(device);
  for (const cpu of availableCPUs) {
    if (cpu === DeviceABI.universal) continue;
    const matches = elements.filter(
      ({ filters }) =>
        filters.length === 1 && filters[0]!.filterType === 'ABI' && filters[0]!.value === cpu
    );
    if (matches.length === 1) {
      const outputFile = matches[0]!.outputPath;
      debugEvent('android:apk_resolved_abi_split', { outputFile });
      return outputFile;
    }
  }

  const universal = elements.filter(({ filters }) => filters.length === 0);
  if (universal.length === 1) {
    const outputFile = universal[0]!.outputPath;
    debugEvent('android:apk_resolved', { outputFile });
    return outputFile;
  }
  return null;
}

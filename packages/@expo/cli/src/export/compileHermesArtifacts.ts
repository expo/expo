import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import assert from 'node:assert';

export async function compileHermesArtifactsAsync(
  projectRoot: string,
  artifacts: SerialAsset[]
): Promise<void> {
  for (const artifact of artifacts) {
    if (artifact.type !== 'js' || Buffer.isBuffer(artifact.source)) continue;
    const filename = artifact.filename;
    const map = artifacts.find(
      (asset) => asset.type === 'map' && asset.filename === `${filename}.map`
    );

    const unavailableMessage =
      'Hermes artifact compilation is unavailable. Align the @expo/metro-config version resolved by @expo/cli with the project serializer.';
    const { transformJsAssetToHermesBytecodeAsync } =
      await import('@expo/metro-config/build/serializer/hermesArtifacts').catch((cause) => {
        throw new Error(unavailableMessage, { cause });
      });
    assert(typeof transformJsAssetToHermesBytecodeAsync === 'function', unavailableMessage);
    await transformJsAssetToHermesBytecodeAsync(projectRoot, artifact, map);
    assert(Buffer.isBuffer(artifact.source), `Hermes did not compile ${filename}`);
  }
}

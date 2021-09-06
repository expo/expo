import { useEffect, useState } from 'react';
import { Asset } from './Asset';
/**
 * Downloads and stores one or more assets locally.
 * After the assets are loaded, this hook returns a list of asset instances.
 * If something went wrong when loading the assets, an error is returned.
 *
 * Note, the assets are not "reloaded" when you dynamically change the asset list.
 *
 * @see https://docs.expo.io/versions/latest/sdk/asset/
 * @example
 * ```tsx
 * const [assets, error] = useAssets(require('path/to/asset.jpg'));
 *
 * return !assets ? null : <Image source={assets[0]} />;
 * ```
 */
export function useAssets(moduleIds) {
    const [assets, setAssets] = useState();
    const [error, setError] = useState();
    useEffect(() => {
        Asset.loadAsync(moduleIds).then(setAssets).catch(setError);
    }, []);
    return [assets, error];
}
//# sourceMappingURL=AssetHooks.js.map
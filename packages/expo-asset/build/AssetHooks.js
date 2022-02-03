import { useEffect, useState } from 'react';
import { Asset } from './Asset';
// @needsAudit
/**
 * Downloads and stores one or more assets locally.
 * After the assets are loaded, this hook returns a list of asset instances.
 * If something went wrong when loading the assets, an error is returned.
 *
 * > Note, the assets are not "reloaded" when you dynamically change the asset list.
 *
 * @return Returns an array containing:
 * - on the first position, a list of all loaded assets. If they aren't loaded yet, this value is
 *   `undefined`.
 * - on the second position, an error which encountered when loading the assets. If there was no
 *   error, this value is `undefined`.
 *
 * @example
 * ```tsx
 * const [assets, error] = useAssets([require('path/to/asset.jpg'), require('path/to/other.png')]);
 *
 * return assets ? <Image source={assets[0]} /> : null;
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
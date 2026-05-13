import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { clearSharedPayloads, getResolvedSharedPayloadsAsync, getSharedPayloads } from './Sharing';
function sharePayloadsAreEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    const counts = new Map();
    const getKey = (item) => `${item.value}|${item.mimeType}|${item.shareType}`;
    for (const item of a) {
        const key = getKey(item);
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    for (const item of b) {
        const key = getKey(item);
        const count = counts.get(key);
        if (!count) {
            return false;
        }
        counts.set(key, count - 1);
    }
    return true;
}
/**
 * Hook, which returns the data shared with the application and updates the data if the shared payload has changed.
 */
export function useIncomingShare() {
    const [sharedPayloads, setSharedPayloads] = useState(getSharedPayloads());
    const [resolvedSharedPayloads, setResolvedSharedPayloads] = useState([]);
    const [isResolving, setIsResolving] = useState(false);
    const [error, setError] = useState(null);
    const currentSharedDataRef = useRef([]);
    const refreshSharePayloads = useCallback(async () => {
        try {
            const newSharedData = getSharedPayloads();
            // Do not run `getResolvedSharedDataAsync` if the data hasn't changed to reduce network usage
            if (sharePayloadsAreEqual(newSharedData, currentSharedDataRef.current)) {
                return;
            }
            currentSharedDataRef.current = newSharedData;
            setSharedPayloads(newSharedData);
            setResolvedSharedPayloads([]);
            setError(null);
            if (newSharedData.length > 0) {
                setIsResolving(true);
                try {
                    const resolved = await getResolvedSharedPayloadsAsync();
                    setResolvedSharedPayloads(resolved);
                }
                catch (e) {
                    setError(e instanceof Error ? e : new Error('Unknown error during shared payload resolution'));
                }
                finally {
                    setIsResolving(false);
                }
            }
        }
        catch (e) {
            setError(e instanceof Error ? e : new Error('Failed to resolve data'));
        }
    }, []);
    useEffect(() => {
        refreshSharePayloads();
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                refreshSharePayloads();
            }
        });
        return () => {
            subscription.remove();
        };
    }, [refreshSharePayloads]);
    return {
        sharedPayloads,
        resolvedSharedPayloads,
        clearSharedPayloads,
        isResolving,
        error,
        refreshSharePayloads,
    };
}
//# sourceMappingURL=useIncomingShare.js.map
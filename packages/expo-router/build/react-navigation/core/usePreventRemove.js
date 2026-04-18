'use client';
import { nanoid } from 'nanoid/non-secure';
import * as React from 'react';
import useLatestCallback from '../../utils/useLatestCallback';
import { useNavigation } from './useNavigation';
import { usePreventRemoveContext } from './usePreventRemoveContext';
import { useRoute } from './useRoute';
/**
 * Hook to prevent screen from being removed. Can be used to prevent users from leaving the screen.
 *
 * @param preventRemove Boolean indicating whether to prevent screen from being removed.
 * @param callback Function which is executed when screen was prevented from being removed.
 */
export function usePreventRemove(preventRemove, callback) {
    const [id] = React.useState(() => nanoid());
    const navigation = useNavigation();
    const { key: routeKey } = useRoute();
    const { setPreventRemove } = usePreventRemoveContext();
    React.useEffect(() => {
        setPreventRemove(id, routeKey, preventRemove);
        return () => {
            setPreventRemove(id, routeKey, false);
        };
    }, [setPreventRemove, id, routeKey, preventRemove]);
    const beforeRemoveListener = useLatestCallback((e) => {
        if (!preventRemove) {
            return;
        }
        e.preventDefault();
        callback({ data: e.data });
    });
    React.useEffect(() => navigation?.addListener('beforeRemove', beforeRemoveListener), [navigation, beforeRemoveListener]);
}
//# sourceMappingURL=usePreventRemove.js.map
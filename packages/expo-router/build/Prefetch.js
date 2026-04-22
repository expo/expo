import { useLayoutEffect } from 'react';
import { router } from './imperative-api';
import { useOptionalNavigation } from './link/useLoadedNavigation';
/**
 * When rendered on a focused screen, this component will preload the specified route.
 */
export function Prefetch(props) {
    const navigation = useOptionalNavigation();
    useLayoutEffect(() => {
        if (navigation?.isFocused()) {
            router.prefetch(props.href);
        }
    }, [navigation, props.href]);
    return null;
}
//# sourceMappingURL=Prefetch.js.map
import { useEffect } from 'react';
import ExpoKeepAwake from './ExpoKeepAwake';
const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';
export function useKeepAwake(tag = ExpoKeepAwakeTag) {
    useEffect(() => {
        activateKeepAwake(tag);
        return () => deactivateKeepAwake(tag);
    }, [tag]);
}
export function activateKeepAwake(tag = ExpoKeepAwakeTag) {
    if (ExpoKeepAwake.activate)
        ExpoKeepAwake.activate(tag);
}
export function deactivateKeepAwake(tag = ExpoKeepAwakeTag) {
    if (ExpoKeepAwake.deactivate)
        ExpoKeepAwake.deactivate(tag);
}
//# sourceMappingURL=index.js.map
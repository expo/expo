import React, { useEffect } from 'react';
import ExpoKeepAwake from './ExpoKeepAwake';
// NOTE(brentvatne): in tests this value won't be reset because we
// can render a component and never unmount it.
let __keepAwakeMountedCount = 0;
const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';
export default class KeepAwake extends React.PureComponent {
    componentDidMount() {
        console.warn(`The KeepAwake component has been deprecated in favor of the useKeepAwake hook and will be removed in SDK 35`);
        __keepAwakeMountedCount++;
        if (__keepAwakeMountedCount === 1) {
            activateKeepAwake();
        }
    }
    componentWillUnmount() {
        __keepAwakeMountedCount--;
        if (__keepAwakeMountedCount === 0) {
            deactivateKeepAwake();
        }
    }
    render() {
        return null;
    }
}
KeepAwake.activate = (tag) => {
    console.warn(`The "KeepAwake.activate" static method has been deprecated in favor of the "activateKeepAwake" function exported from expo-keep-awake and will be removed in SDK 35`);
    activateKeepAwake(tag);
};
KeepAwake.deactivate = (tag) => {
    console.warn(`The "KeepAwake.deactivate" static method has been deprecated in favor of the "deactivateKeepAwake" function exported from expo-keep-awake and will be removed in SDK 35`);
    deactivateKeepAwake(tag);
};
export function useKeepAwake(tag = ExpoKeepAwakeTag) {
    useEffect(() => {
        activateKeepAwake(tag);
        return () => deactivateKeepAwake(tag);
    }, [tag]);
}
export function activateKeepAwake(tag = ExpoKeepAwakeTag) {
    ExpoKeepAwake.activate(tag);
}
export function deactivateKeepAwake(tag = ExpoKeepAwakeTag) {
    ExpoKeepAwake.deactivate(tag);
}
export function activate(tag) {
    console.warn(`"activate" from expo-keep-awake has been deprecated in favor of "activateKeepAwake" and will be removed in SDK 35`);
    activateKeepAwake(tag);
}
export function deactivate(tag) {
    console.warn(`"deactivate" from expo-keep-awake has been deprecated in favor of "deactivateKeepAwake" and will be removed in SDK 35`);
    deactivateKeepAwake(tag);
}
//# sourceMappingURL=index.js.map
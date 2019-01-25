import React from 'react';
import ExpoKeepAwake from './ExpoKeepAwake';
// NOTE(brentvatne): in tests this value won't be reset because we
// can render a component and never unmount it.
let __keepAwakeMountedCount = 0;
export default class KeepAwake extends React.PureComponent {
    componentDidMount() {
        __keepAwakeMountedCount = __keepAwakeMountedCount + 1;
        if (__keepAwakeMountedCount === 1) {
            ExpoKeepAwake.activate();
        }
    }
    componentWillUnmount() {
        __keepAwakeMountedCount = __keepAwakeMountedCount - 1;
        if (__keepAwakeMountedCount == 0) {
            ExpoKeepAwake.deactivate();
        }
    }
    render() {
        return null;
    }
}
KeepAwake.activate = activate;
KeepAwake.deactivate = deactivate;
export function activate() {
    ExpoKeepAwake.activate();
}
export function deactivate() {
    ExpoKeepAwake.deactivate();
}
//# sourceMappingURL=KeepAwake.js.map
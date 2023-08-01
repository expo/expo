import React from 'react';
import { Platform } from 'react-native';
import ErrorToastContainer from './toast/ErrorToastContainer';
if (!global.setImmediate) {
    global.setImmediate = function (fn) {
        return setTimeout(fn, 0);
    };
}
if (process.env.NODE_ENV === 'development' && Platform.OS === 'web') {
    // Stack traces are big with React Navigation
    require('./LogBox').default.install();
}
export function withErrorOverlay(Comp) {
    if (process.env.NODE_ENV === 'production') {
        return Comp;
    }
    return function ErrorOverlay(props) {
        return (React.createElement(ErrorToastContainer, null,
            React.createElement(Comp, { ...props })));
    };
}
//# sourceMappingURL=index.js.map
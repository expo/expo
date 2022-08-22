import * as React from 'react';
import DevLoadingView from '../environment/DevLoadingView';
export default function DevAppContainer({ children }) {
    return (React.createElement(React.Fragment, null,
        children,
        React.createElement(DevLoadingView, null)));
}
//# sourceMappingURL=DevAppContainer.js.map
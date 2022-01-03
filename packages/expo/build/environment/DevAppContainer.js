import * as React from 'react';
import DevLoadingView from '../environment/DevLoadingView';
class DevAppContainer extends React.Component {
    render() {
        return(/*#__PURE__*/ React.createElement(React.Fragment, null, this.props.children, /*#__PURE__*/ React.createElement(DevLoadingView, null)));
    }
}
export { DevAppContainer as default };

//# sourceMappingURL=DevAppContainer.js.map
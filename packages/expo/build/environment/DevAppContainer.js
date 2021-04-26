import * as React from 'react';
import DevLoadingView from '../environment/DevLoadingView';
export default class DevAppContainer extends React.Component {
    render() {
        return (React.createElement(React.Fragment, null,
            this.props.children,
            React.createElement(DevLoadingView, null)));
    }
}
//# sourceMappingURL=DevAppContainer.js.map
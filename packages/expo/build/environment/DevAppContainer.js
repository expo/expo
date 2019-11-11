import * as React from 'react';
import DevLoadingView from '../environment/DevLoadingView';
export default class DevAppContainer extends React.Component {
    render() {
        return (<>
        {this.props.children}
        <DevLoadingView />
      </>);
    }
}
//# sourceMappingURL=DevAppContainer.js.map
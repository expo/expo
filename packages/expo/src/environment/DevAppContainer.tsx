import * as React from 'react';

import DevLoadingView from '../environment/DevLoadingView';

export default class DevAppContainer extends React.Component<{ children?: React.ReactNode }> {
  render() {
    return (
      <>
        {this.props.children}
        <DevLoadingView />
      </>
    );
  }
}

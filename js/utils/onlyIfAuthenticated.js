/* @flow */

import React from 'react';
import { connect } from 'react-redux';
import isUserAuthenticated from './isUserAuthenticated';

@connect(data => Authenticated.getDataProps(data))
class Authenticated extends React.Component {
  static getDataProps(data) {
    return {
      isAuthenticated: isUserAuthenticated(data.session),
    };
  }

  render() {
    if (this.props.isAuthenticated) {
      return this.props.children;
    } else {
      return null;
    }
  }
}

export default function onlyIfAuthenticated(TargetComponent: any) {
  class OnlyIfAuthenticated extends React.Component {
    render() {
      return (
        <Authenticated>
          <TargetComponent {...this.props} />
        </Authenticated>
      );
    }
  }

  return OnlyIfAuthenticated;
}

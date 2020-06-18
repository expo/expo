/* @flow */

import React from 'react';
import { connect } from 'react-redux';

import { StyledView } from '../components/Views';
import Colors from '../constants/Colors';
import ExploreTabContainer from '../containers/ExploreTabContainer';
import isUserAuthenticated from '../utils/isUserAuthenticated';

@connect(data => ExploreScreen.getDataProps(data))
export default class ExploreScreen extends React.Component {
  static navigationOptions = {
    title: 'Explore',
  };

  static getDataProps(data) {
    return {
      isAuthenticated: isUserAuthenticated(data.session),
    };
  }

  render() {
    return (
      <StyledView
        style={{ flex: 1 }}
        darkBackgroundColor="#000"
        lightBackgroundColor={Colors.light.greyBackground}>
        <ExploreTabContainer
          filter="FEATURED"
          key={this.props.isAuthenticated ? 'authenticated' : 'guest'}
          onPressUsername={this._handlePressUsername}
        />
      </StyledView>
    );
  }

  _handlePressUsername = (username: string) => {
    this.props.navigation.push('Profile', { username });
  };
}

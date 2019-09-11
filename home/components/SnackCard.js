/* @flow */

import React from 'react';
import { Linking, Platform, Share, StyleSheet, TouchableHighlight, View } from 'react-native';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';
import UrlUtils from '../utils/UrlUtils';
import { StyledText } from './Text';
import { StyledButton, StyledView } from './Views';

function isDescriptionEmpty(description) {
  if (!description || description === 'No description') {
    return true;
  } else {
    return false;
  }
}

@withNavigation
export default class SnackCard extends React.PureComponent {
  render() {
    let { description, projectName } = this.props;

    return (
      <StyledButton
        onLongPress={this._handleLongPressProject}
        onPress={this._handlePressProject}
        style={styles.container}
        fallback={TouchableHighlight}
        underlayColor="#b7b7b7">
        <StyledView style={styles.infoContainer}>
          <StyledText style={styles.projectNameText} ellipsizeMode="tail" numberOfLines={1}>
            {projectName}
          </StyledText>

          {isDescriptionEmpty(description) ? null : (
            <View style={[styles.projectExtraInfoContainer, { marginTop: 5 }]}>
              <StyledText
                style={styles.projectExtraInfoText}
                ellipsizeMode="tail"
                numberOfLines={1}
                darkColor="#ccc">
                {description}
              </StyledText>
            </View>
          )}
        </StyledView>
      </StyledButton>
    );
  }

  _handlePressProject = () => {
    let url = UrlUtils.normalizeUrl(this.props.projectUrl);
    Linking.openURL(url);
  };

  _handleLongPressProject = () => {
    let url = UrlUtils.normalizeUrl(this.props.projectUrl);
    Share.share({
      title: this.props.projectName,
      message: url,
      url,
    });
  };

  _handlePressUsername = () => {
    this.props.navigation.navigate('Profile', { username: this.props.username });
  };
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: 'row',
    flex: 1,
    paddingBottom: 3,
  },
  infoContainer: {
    backgroundColor: 'transparent',
    paddingTop: 13,
    paddingHorizontal: 16,
    flexDirection: 'column',
    alignSelf: 'stretch',
    paddingBottom: 10,
  },
  projectNameText: {
    fontSize: 15,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '400',
        marginTop: 1,
      },
    }),
  },
  projectExtraInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectExtraInfoText: {
    color: Colors.light.greyText,
    fontSize: 13,
  },
});

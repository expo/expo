/* @flow */

import React from 'react';
import { Platform, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';
import requestCameraPermissionsAsync from '../utils/requestCameraPermissionsAsync';

import { StyledText } from './Text';
import { StyledButton, StyledView } from './Views';
import { Ionicons } from './Icons';

@withNavigation
export default class QRCodeButton extends React.Component {
  render() {
    let { fullWidthBorder } = this.props;

    return (
      <StyledButton
        onPress={this._handlePressAsync}
        fallback={TouchableHighlight}
        style={[styles.container, fullWidthBorder && styles.bottomBorder]}
        underlayColor="#b7b7b7">
        <View style={styles.iconContainer}>
          <Ionicons
            name={Platform.OS === 'ios' ? 'ios-qr-scanner' : 'md-qr-scanner'}
            lightColor="#888"
            darkColor="#fff"
            size={28}
          />
        </View>

        <StyledView style={[styles.infoContainer, !fullWidthBorder && styles.bottomBorder]}>
          <StyledText style={styles.titleText} ellipsizeMode="tail" numberOfLines={1}>
            Scan QR Code
          </StyledText>

          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleText} ellipsizeMode="tail" numberOfLines={1}>
              Open your projects without typing
            </Text>
          </View>
        </StyledView>
      </StyledButton>
    );
  }

  _handlePressAsync = async () => {
    if (await requestCameraPermissionsAsync()) {
      this.props.navigation.navigate('QRCode');
    } else {
      alert('In order to use the QR Code scanner you need to provide camera permissions');
    }
  };
}

const styles = StyleSheet.create({
  bottomBorder: {
    flexGrow: 1,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  container: {
    flexDirection: 'row',
    paddingLeft: 5,
    flex: 1,
  },
  iconContainer: {
    width: 50,
    paddingTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    backgroundColor: 'transparent',
    paddingTop: 13,
    flexDirection: 'column',
    alignSelf: 'stretch',
    paddingBottom: 10,
  },
  titleText: {
    fontSize: 15,
    marginRight: 70,
    marginBottom: 2,
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
  subtitleText: {
    marginRight: 5,
    flex: 1,
    color: Colors.light.greyText,
    fontSize: 13,
  },
});

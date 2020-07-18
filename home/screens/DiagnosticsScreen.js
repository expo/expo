import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BaseButton } from 'react-native-gesture-handler';
import { ThemeContext } from 'react-navigation';

import ScrollView from '../components/NavigationScrollView';
import { StyledText } from '../components/Text';
import Colors from '../constants/Colors';
import Environment from '../utils/Environment';

class ShadowButton extends React.Component {
  static contextType = ThemeContext;

  state = {
    scale: new Animated.Value(1),
  };

  _handleGestureStateChange = active => {
    if (active) {
      Animated.spring(this.state.scale, { useNativeDriver: true, toValue: 0.95 }).start();
    } else {
      Animated.spring(this.state.scale, { useNativeDriver: true, toValue: 1 }).start();
    }
  };

  render() {
    return (
      <BaseButton
        onPress={this.props.onPress}
        onActiveStateChange={this._handleGestureStateChange}
        style={{
          paddingHorizontal: 15,
          paddingTop: 15,
          paddingBottom: 15,
          marginTop: -5,
        }}>
        <Animated.View
          style={{
            backgroundColor: this.context === 'light' ? '#fff' : Colors.dark.cardBackground,
            padding: 15,
            borderRadius: 10,
            shadowOffset: { width: 0, height: 0 },
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 10,
            transform: [{ scale: this.state.scale }],
          }}>
          {this.props.children}
        </Animated.View>
      </BaseButton>
    );
  }
}

export default class DiagnosticsScreen extends React.Component {
  static navigationOptions = {
    title: 'Diagnostics',
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.light.greyBackground }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 15 }}>
          <AudioDiagnostic navigation={this.props.navigation} />
          {Environment.IsIOSRestrictedBuild ? (
            <ForegroundLocationDiagnostic navigation={this.props.navigation} />
          ) : (
            <BackgroundLocationDiagnostic navigation={this.props.navigation} />
          )}
          <GeofencingDiagnostic navigation={this.props.navigation} />
        </ScrollView>
      </View>
    );
  }
}

function AudioDiagnostic(props) {
  return (
    <ShadowButton onPress={() => props.navigation.navigate('Audio')}>
      <StyledText style={styles.titleText}>Audio</StyledText>
      <StyledText style={styles.bodyText}>
        On iOS you can play audio
        {!Environment.IsIOSRestrictedBuild ? ` in the foreground and background` : ``}, choose
        whether it plays when the device is on silent, and set how the audio interacts with audio
        from other apps. This diagnostic allows you to see the available options.
      </StyledText>
    </ShadowButton>
  );
}

function BackgroundLocationDiagnostic(props) {
  return (
    <ShadowButton onPress={() => props.navigation.navigate('Location')}>
      <StyledText style={styles.titleText}>Background location</StyledText>
      <StyledText style={styles.bodyText}>
        On iOS it's possible to track your location when an app is foregrounded, backgrounded, or
        even closed. This diagnostic allows you to see what options are available, see the output,
        and test the functionality on your device. None of the location data will leave your device.
      </StyledText>
    </ShadowButton>
  );
}

function ForegroundLocationDiagnostic(props) {
  return (
    <ShadowButton onPress={() => props.navigation.navigate('Location')}>
      <StyledText style={styles.titleText}>Location (when app in use)</StyledText>
      <StyledText style={styles.bodyText}>
        On iOS, there are different permissions for tracking your location. This diagnostic allows
        you to see what options are available and test the functionality on your device while you
        are using the app (background location is available only in standalone apps). None of the
        location data will leave your device.
      </StyledText>
    </ShadowButton>
  );
}

function GeofencingDiagnostic(props) {
  return (
    <ShadowButton onPress={() => props.navigation.navigate('Geofencing')}>
      <StyledText style={styles.titleText}>Geofencing</StyledText>
      <StyledText style={styles.bodyText}>
        You can fire actions when your device enters specific geographical regions represented by a
        longitude, latitude, and a radius. This diagnostic lets you experiment with Geofencing using
        regions that you specify and shows you the data that is made available. None of the data
        will leave your device.
      </StyledText>
    </ShadowButton>
  );
}

const styles = StyleSheet.create({
  titleText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.6,
  },
});

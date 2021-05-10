import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';

import { doesDeviceSupportKeyCommands } from '../DevMenuInternal';
import * as DevMenuInternal from '../DevMenuInternal';
import { StyledText } from '../components/Text';
import { TouchableOpacity } from '../components/Touchables';
import { StyledView } from '../components/Views';
import Colors from '../constants/Colors';

type Props = {
  show: boolean;
};

type State = {
  finished: boolean;
};

const KEYBOARD_CODES = {
  ios: '\u2318D',
  android: '\u2318M on MacOS or Ctrl+M on other platforms',
};

const MENU_NARROW_SCREEN = Dimensions.get('window').width < 375;
const ONBOARDING_MESSAGE = (() => {
  let fragment;
  if (doesDeviceSupportKeyCommands) {
    fragment = `in a simulator you can press ${KEYBOARD_CODES[Platform.OS]}`;
    if (Platform.OS === 'ios') {
      fragment += ` (make sure that 'I/O -> Send Keyboard Input to Device' is enabled on your simulator)`;
    }
  } else {
    fragment = 'you can shake your device or long press anywhere on the screen with three fingers';
  }
  return `Since this is your first time opening the Expo client, we wanted to show you this menu and let you know that ${fragment} to get back to it at any time.`;
})();

class DevMenuOnboarding extends React.PureComponent<Props, State> {
  state = {
    finished: false,
  };

  onPress = () => {
    DevMenuInternal.setOnboardingFinished(true);
    this.setState({ finished: true });
  };

  render() {
    if (!this.props.show || this.state.finished) {
      return null;
    }

    const headingStyles = MENU_NARROW_SCREEN
      ? [styles.onboardingHeading, styles.onboardingHeadingNarrow]
      : styles.onboardingHeading;

    return (
      <View style={styles.onboardingContainer}>
        <StyledView
          style={styles.onboardingBackground}
          lightBackgroundColor="#fff"
          darkBackgroundColor="#000"
        />
        <View style={styles.onboardingContent}>
          <View style={styles.onboardingHeadingRow}>
            <StyledText style={headingStyles} lightColor="#595c68">
              Hello there, friend! 👋
            </StyledText>
          </View>
          <StyledText style={styles.onboardingTooltip} lightColor="#595c68">
            {ONBOARDING_MESSAGE}
          </StyledText>
          <StyledText style={styles.onboardingTooltip} lightColor="#595c68">
            Also, this menu is only available in development and won't be in any release builds.
          </StyledText>
          <TouchableOpacity style={styles.onboardingButton} onPress={this.onPress}>
            <Text style={styles.onboardingButtonLabel}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
    paddingHorizontal: 24,
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  onboardingBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  onboardingContent: {
    marginTop: Dimensions.get('window').height * 0.12,
  },
  onboardingHeadingRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginRight: 16,
    marginBottom: 8,
  },
  onboardingHeading: {
    flex: 1,
    fontWeight: '700',
    fontSize: 22,
  },
  onboardingHeadingNarrow: {
    fontSize: 18,
    marginTop: 2,
  },
  onboardingTooltip: {
    marginVertical: 10,
    fontSize: 16,
  },
  onboardingButton: {
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.tint,
    borderRadius: 3,
  },
  onboardingButtonLabel: {
    color: '#fff',
    fontSize: 16,
  },
});

export default DevMenuOnboarding;

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity as TouchableOpacityRN, View } from 'react-native';
import { TouchableOpacity as TouchableOpacityGH } from 'react-native-gesture-handler';

import { StyledText } from '../components/Text';

type Props = {
  buttonKey: string;
  label: string;
  onPress: (key: string) => any;
  icon?: string;
  isEnabled?: boolean;
  detail?: string;
};

// When rendered inside bottom sheet, touchables from RN don't work on Android, but the ones from GH don't work on iOS.
const TouchableOpacity = Platform.OS === 'android' ? TouchableOpacityGH : TouchableOpacityRN;

const LIGHT_DISABLED_TEXT_COLOR = '#9ca0a6';
const DARK_DISABLED_TEXT_COLOR = 'rgba(255, 255, 255, 0.7)';

class DevMenuButton extends React.PureComponent<Props, any> {
  static defaultProps = {
    isEnabled: true,
  };

  state = {
    showDetails: true,
  };

  onPress = () => {
    if (this.props.onPress) {
      this.props.onPress(this.props.buttonKey);
    }
  };

  renderButtonIcon(icon: string | undefined, isEnabled: boolean) {
    if (!icon) {
      return null;
    }

    return (
      <View style={styles.buttonIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={isEnabled ? '#2F9BE4' : '#888'} />
      </View>
    );
  }

  renderLabel(label: string, enabled: boolean) {
    if (enabled) {
      return (
        <StyledText style={styles.buttonText} lightColor="#595c68">
          {label}
        </StyledText>
      );
    } else {
      return (
        <StyledText
          style={styles.buttonText}
          lightColor={LIGHT_DISABLED_TEXT_COLOR}
          darkColor={DARK_DISABLED_TEXT_COLOR}>
          {label}
        </StyledText>
      );
    }
  }

  renderDetail(detail?: string) {
    return (
      <StyledText
        style={[styles.buttonText, styles.buttonDetailsText]}
        darkColor={DARK_DISABLED_TEXT_COLOR}
        lightColor={LIGHT_DISABLED_TEXT_COLOR}>
        {detail ? detail : 'Only available in development mode.'}
      </StyledText>
    );
  }

  render() {
    const { label, icon, isEnabled, detail } = this.props;
    const { showDetails } = this.state;

    return (
      <TouchableOpacity style={styles.button} onPress={this.onPress} disabled={!isEnabled}>
        {this.renderButtonIcon(icon, !!isEnabled)}

        <View style={styles.buttonRow}>
          {this.renderLabel(label, !!isEnabled)}
          {!isEnabled && showDetails && this.renderDetail(detail)}
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  buttonRow: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingRight: 20,
  },
  buttonIcon: {
    marginLeft: 20,
    marginRight: 8,
    marginTop: 2,
  },
  buttonText: {
    fontSize: 14,
    textAlign: 'left',
    fontWeight: '700',
  },
  buttonDetailsText: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: 'normal',
  },
});

export default DevMenuButton;

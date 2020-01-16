import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity as TouchableOpacityGH } from 'react-native-gesture-handler';
import { Platform, StyleSheet, TouchableOpacity as TouchableOpacityRN, View } from 'react-native';

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

const LabelNameOverrides = {
  'Reload JS Bundle': 'Reload JS Bundle only',
};

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

  renderButtonIcon(icon?: string) {
    if (!icon) {
      return null;
    }

    return (
      <View style={styles.buttonIcon}>
        <MaterialCommunityIcons name={icon} size={20} color="#2F9BE4" />
      </View>
    );
  }

  renderLabel(label: string, enabled: boolean) {
    const normalizedLabel = LabelNameOverrides[label] || label;

    if (enabled) {
      return (
        <StyledText style={styles.buttonText} lightColor="#595c68">
          {normalizedLabel}
        </StyledText>
      );
    } else {
      return (
        <StyledText
          style={styles.buttonText}
          lightColor={LIGHT_DISABLED_TEXT_COLOR}
          darkColor={DARK_DISABLED_TEXT_COLOR}>
          {normalizedLabel}
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
        {detail ? detail : 'Only available in development mode'}
      </StyledText>
    );
  }

  render() {
    const { label, icon, isEnabled, detail } = this.props;
    const { showDetails } = this.state;

    return (
      <TouchableOpacity style={styles.button} onPress={this.onPress} disabled={!isEnabled}>
        {this.renderButtonIcon(icon)}

        <View style={styles.buttonColumn}>
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
  },
  buttonColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  buttonIcon: {
    marginVertical: 12,
    marginLeft: 20,
    marginRight: 7,
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 14,
    textAlign: 'left',
    margin: 5,
    fontWeight: '700',
  },
  buttonDetailsText: {
    marginTop: -6,
    fontSize: 12,
    fontWeight: 'normal',
  },
});

export default DevMenuButton;

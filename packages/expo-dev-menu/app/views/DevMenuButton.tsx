import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DevMenuKeyCommand } from '../DevMenuInternal';
import DevMenuKeyCommandLabel from '../components/DevMenuKeyCommandLabel';
import { StyledText } from '../components/Text';
import { TouchableOpacity } from '../components/Touchables';
import { StyledIcon } from '../components/Views';
import Colors from '../constants/Colors';

type Props = {
  buttonKey: string;
  label: string;
  onPress: (key: string) => any;
  icon?: string | null;
  isEnabled?: boolean;
  detail?: string;
  keyCommand?: DevMenuKeyCommand;
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

  renderButtonIcon(icon: string | undefined, isEnabled: boolean) {
    if (!icon) {
      return null;
    }

    return (
      <View style={styles.buttonIcon}>
        <StyledIcon component={MaterialCommunityIcons} name={icon} size={22} color="menuItemText" />
      </View>
    );
  }

  renderLabel(label: string, enabled: boolean) {
    if (enabled) {
      return (
        <StyledText
          style={styles.buttonText}
          lightColor={Colors.light.menuItemText}
          darkColor={Colors.dark.menuItemText}>
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

  renderKeyCommand(keyCommand?: DevMenuKeyCommand) {
    if (!keyCommand) {
      return null;
    }
    return (
      <View style={styles.keyCommand}>
        <DevMenuKeyCommandLabel {...keyCommand} />
      </View>
    );
  }

  render() {
    const { label, icon, isEnabled, detail, keyCommand } = this.props;
    const { showDetails } = this.state;

    return (
      <TouchableOpacity
        style={styles.button}
        onPress={this.onPress}
        disabled={!isEnabled}
        activeOpacity={0.6}>
        {this.renderButtonIcon(icon, !!isEnabled)}

        <View style={styles.buttonRow}>
          {this.renderLabel(label, !!isEnabled)}
          {!isEnabled && showDetails && this.renderDetail(detail)}
        </View>

        {this.renderKeyCommand(keyCommand)}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  buttonRow: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  buttonIcon: {
    marginHorizontal: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    textAlign: 'left',
  },
  buttonDetailsText: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: 'normal',
  },
  keyCommand: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});

export default DevMenuButton;

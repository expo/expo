import { bool } from 'prop-types';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import rem from './rem';

class AppText extends React.PureComponent {
  static contextTypes = {
    isInAParentText: bool,
  };

  render() {
    const { accessibilityRole, style, ...rest } = this.props;
    const isInAParentText = this.context;
    return (
      <Text
        {...rest}
        accessibilityRole={rest.href ? 'link' : accessibilityRole}
        style={[!isInAParentText && styles.baseText, style, rest.href && styles.link]}
      />
    );
  }
}

export default AppText;

const styles = StyleSheet.create({
  baseText: {
    fontSize: rem(1),
    lineHeight: rem(1.3125),
  },
  link: {
    color: '#1B95E0',
    marginTop: rem(0.5 * 1.3125),
    textDecorationLine: 'underline',
  },
});

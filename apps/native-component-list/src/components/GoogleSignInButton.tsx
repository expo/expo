import React, { PropsWithChildren } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

const googleIcon = {
  uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/200px-Google_%22G%22_Logo.svg.png',
};

type Props = PropsWithChildren<TouchableOpacityProps>;

const GoogleSignInButton = ({ children, style, disabled, ...props }: Props) => (
  <TouchableOpacity
    disabled={disabled}
    activeOpacity={0.6}
    style={StyleSheet.flatten([styles.touchable, style])}
    {...props}>
    <View style={styles.content}>
      <Image source={googleIcon} style={styles.icon} />
      <Text style={styles.text}>{children}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  touchable: {
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
    overflow: 'visible',
    shadowColor: 'black',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: { width: 24, aspectRatio: 1 },
  text: { color: 'gray', marginLeft: 12, fontSize: 16, fontWeight: '600' },
});

export default GoogleSignInButton;

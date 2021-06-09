import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../constants/Colors';

type TouchableNativeFeedbackProps = React.ComponentProps<typeof TouchableNativeFeedback>;
export default function PrimaryButton({
  children,
  isLoading,
  plain,
  style,
  ...props
}: TouchableNativeFeedbackProps & {
  children: any;
  isLoading?: boolean;
  plain?: boolean;
}) {
  return Platform.OS === 'android' ? (
    <TouchableNativeFeedback {...props}>
      <View style={[plain ? styles.plainButton : styles.button, style]}>
        <Text style={plain ? styles.plainButtonText : styles.buttonText}>{children}</Text>
        {isLoading && (
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>
    </TouchableNativeFeedback>
  ) : (
    <TouchableOpacity {...props} style={[plain ? styles.plainButton : styles.button, style]}>
      <Text style={plain ? styles.plainButtonText : styles.buttonText}>{children}</Text>
      {isLoading && (
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    position: 'absolute',
    top: 0,
    right: 15,
    bottom: 0,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: Colors.light.tintColor,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    ...Platform.select({
      android: {
        fontSize: 16,
      },
      ios: {
        fontSize: 15,
        fontWeight: '600',
      },
    }),
  },
  plainButton: {},
  plainButtonText: {
    color: Colors.light.tintColor,
    textAlign: 'center',
    ...Platform.select({
      android: {
        fontSize: 16,
      },
      ios: {
        fontSize: 15,
      },
    }),
  },
});

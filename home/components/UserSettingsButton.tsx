import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useNavigation, useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

import onlyIfAuthenticated from '../utils/onlyIfAuthenticated';

function UserSettingsButton() {
  const theme = useTheme();
  const navigation = useNavigation();
  const onPress = () => {
    navigation.navigate('UserSettings');
  };

  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={onPress}>
      {Platform.select({
        ios: <Text style={{ fontSize: 17, color: theme.colors.primary }}>Options</Text>,
        android: <Ionicons name="md-settings" size={27} color={theme.colors.text} />,
      })}
    </TouchableOpacity>
  );
}

export default onlyIfAuthenticated(UserSettingsButton);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});

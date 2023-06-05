import { H4 } from '@expo/html-elements';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import * as ImagePicker from 'expo-image-picker';
import * as SystemUI from 'expo-system-ui';
import { InterfaceStyle, useInterfaceStyle } from 'expo-system-ui';
import * as React from 'react';
import { ScrollView, TextInput, View, useColorScheme, Button } from 'react-native';

const values: InterfaceStyle[] = ['light', 'dark', 'auto'];

export default function SystemUIThemeScreen() {
  const theme = useColorScheme();
  const interfaceStyle = useInterfaceStyle();

  const backgroundColor = theme === 'dark' ? '#1c1c1c' : 'white';
  const textColor = theme === 'dark' ? 'white' : 'black';

  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        backgroundColor,
      }}>
      <View
        style={{
          gap: 20,
          padding: 20,
          backgroundColor,
        }}>
        <H4 style={{ color: textColor, marginVertical: 0 }}>Switch Theme</H4>
        <SegmentedControl
          values={values}
          selectedIndex={values.indexOf(interfaceStyle)}
          onChange={({ nativeEvent }) => {
            SystemUI.setInterfaceStyleAsync(nativeEvent.value as InterfaceStyle);
          }}
          appearance={theme === 'dark' ? 'dark' : 'light'}
        />
        <TextInput
          placeholder="Enter text..."
          style={{
            padding: 10,
            fontSize: 16,
            color: textColor,
          }}
          placeholderTextColor={textColor}
        />
        <Button
          title="Pick Image"
          onPress={async () => {
            await ImagePicker.launchImageLibraryAsync({});
          }}
        />
      </View>
    </ScrollView>
  );
}

SystemUIThemeScreen.navigationOptions = {
  title: 'System UI Theme',
};

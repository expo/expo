import * as SwiftUI from '@expo/ui/components/SwiftUI';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SwiftUIContainerScreen() {
  const [playSounds, setPlaySounds] = useState(true);
  const [sendReadReceipts, setSendReadReceipts] = useState(false);

  const notifyOptions = ['Direct Messages', 'Mentions', 'Anything'];
  const [selectedNotifyIndex, setSelectedNotifyIndex] = useState<number>(0);
  const profileImageSizes = ['Large', 'Medium', 'Small'];
  const [selectedProfileImageSizeIndex, setSelectedProfileImageSizeIndex] = useState<number>(0);

  return (
    <View style={styles.container}>
      <SwiftUI.Container style={styles.container}>
        <SwiftUI.Form>
          {/* Notifications Section */}
          <SwiftUI.Section title="Notifications">
            <SwiftUI.Picker
              variant="automatic"
              label="Notify Me About"
              options={notifyOptions}
              selectedIndex={selectedNotifyIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedNotifyIndex(index);
              }}
            />
            <SwiftUI.Switch
              label="Play notification sounds"
              value={playSounds}
              onValueChange={setPlaySounds}
            />
            <SwiftUI.Switch
              label="Send read receipts"
              value={sendReadReceipts}
              onValueChange={setSendReadReceipts}
            />
            <SwiftUI.Text weight="regular" size={17}>
              plain text
            </SwiftUI.Text>
          </SwiftUI.Section>

          {/* User Profiles Section */}
          <SwiftUI.Section title="User Profiles">
            <SwiftUI.Picker
              variant="automatic"
              label="Profile Image Size"
              options={profileImageSizes}
              selectedIndex={selectedProfileImageSizeIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedProfileImageSizeIndex(index);
              }}
            />
            <SwiftUI.Button
              onPress={() => {
                alert('Fake cache cleared');
              }}>
              Clear Image Cache
            </SwiftUI.Button>
          </SwiftUI.Section>
        </SwiftUI.Form>

        <SwiftUI.VStack spacing={20} frame={{ height: 300 }}>
          <SwiftUI.HStack spacing={20}>
            <SwiftUI.Text>H0V0</SwiftUI.Text>
            <SwiftUI.Text>H1V0</SwiftUI.Text>
          </SwiftUI.HStack>
          <SwiftUI.HStack spacing={20}>
            <SwiftUI.Text>H0V1</SwiftUI.Text>
            <SwiftUI.Text>H1V1</SwiftUI.Text>
          </SwiftUI.HStack>

          {/* NOTE: To host UIView inside SwiftUI, we may need fixed size and `collapsable={false}` */}
          <SwiftUI.HStack frame={{ width: 300, height: 100 }}>
            <View style={[styles.uiView, { width: 300, height: 100 }]} collapsable={false}>
              <Text style={styles.uiViewText}>Text in UIView</Text>
            </View>
          </SwiftUI.HStack>
        </SwiftUI.VStack>
      </SwiftUI.Container>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  uiView: {
    backgroundColor: '#90EE90',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  uiViewText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

SwiftUIContainerScreen.navigationOptions = {
  title: 'SwiftUI Container',
};

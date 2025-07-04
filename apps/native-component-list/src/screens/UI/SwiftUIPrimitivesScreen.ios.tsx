import {
  Host,
  Switch,
  Picker,
  Section,
  Button,
  Text,
  Form,
  VStack,
  HStack,
  DisclosureGroup,
} from '@expo/ui/swift-ui-primitives';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';

export default function SwiftUIPrimitivesScreen() {
  const [playSounds, setPlaySounds] = useState(true);
  const [sendReadReceipts, setSendReadReceipts] = useState(false);

  const notifyOptions = ['Direct Messages', 'Mentions', 'Anything'];
  const [selectedNotifyIndex, setSelectedNotifyIndex] = useState<number>(0);
  const profileImageSizes = ['Large', 'Medium', 'Small'];
  const [disclosureGroupExpanded, setDisclosureGroupExpanded] = useState<boolean>(false);
  const [selectedProfileImageSizeIndex, setSelectedProfileImageSizeIndex] = useState<number>(0);

  return (
    <ScrollView>
      <Host matchContents useViewportSizeMeasurement>
        <Form>
          {/* Notifications Section */}
          <Section title="Notifications">
            <Picker
              variant="menu"
              label="Notify Me About"
              options={notifyOptions}
              selectedIndex={selectedNotifyIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedNotifyIndex(index);
              }}
            />
            <Switch
              label="Play notification sounds"
              value={playSounds}
              onValueChange={setPlaySounds}
            />
            <Switch
              label="Send read receipts"
              value={sendReadReceipts}
              onValueChange={setSendReadReceipts}
            />
            <Text weight="regular" size={17}>
              plain text
            </Text>
          </Section>

          {/* User Profiles Section */}
          <Section title="User Profiles">
            <Picker
              variant="menu"
              label="Profile Image Size"
              options={profileImageSizes}
              selectedIndex={selectedProfileImageSizeIndex}
              onOptionSelected={({ nativeEvent: { index } }) => {
                setSelectedProfileImageSizeIndex(index);
              }}
            />
            <Button
              onPress={() => {
                alert('Fake cache cleared');
              }}>
              Clear Image Cache
            </Button>
            <DisclosureGroup
              onStateChange={setDisclosureGroupExpanded}
              isExpanded={disclosureGroupExpanded}
              label="Show User Profile Details">
              <Text>Name: John Doe</Text>
              <Text>Email: john.doe@example.com</Text>
              <Text>Role: Administrator</Text>
            </DisclosureGroup>
          </Section>
        </Form>
      </Host>

      <Host style={{ height: 300 }}>
        <VStack spacing={20} frame={{ height: 300 }}>
          <HStack spacing={20}>
            <Text>H0V0</Text>
            <Text>H1V0</Text>
          </HStack>
          <HStack>
            <HStack spacing={20}>
              <Text>H0V1</Text>
              <Text>H1V1</Text>
            </HStack>
          </HStack>

          {/* NOTE: To host UIView inside SwiftUI, we may need fixed size */}
          <HStack frame={{ width: 300, height: 100 }}>
            <View style={[styles.uiView, { width: 300, height: 100 }]}>
              <RNText style={styles.uiViewText}>Text in UIView</RNText>
            </View>
          </HStack>
        </VStack>
      </Host>
    </ScrollView>
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

SwiftUIPrimitivesScreen.navigationOptions = {
  title: 'SwiftUI primitives',
};

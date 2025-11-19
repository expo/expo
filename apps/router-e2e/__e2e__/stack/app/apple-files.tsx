import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';

const AppleFiles = () => {
  return (
    <>
      <Stack.Screen>
        <Stack.Header style={{ backgroundColor: 'transparent' }}>
          <Stack.Header.BackButton hidden />
          <Stack.Header.Title>Apple Files</Stack.Header.Title>
          <Stack.Header.Left>
            <Stack.Header.Button icon="arrow.left" />
            <Stack.Header.Button icon="arrow.right" />
          </Stack.Header.Left>
          <Stack.Header.Right>
            <Stack.Header.Menu icon="ellipsis" separateBackground>
              <Stack.Header.MenuAction icon="checkmark.circle">Select</Stack.Header.MenuAction>
              <Stack.Header.MenuAction icon="doc.text.viewfinder">
                Scan Documents
              </Stack.Header.MenuAction>
              <Stack.Header.MenuAction icon="network">Connect to Server</Stack.Header.MenuAction>
              {/** TODO: Display inline is missing - https://github.com/software-mansion/react-native-screens/pull/3396 */}
              <Stack.Header.Menu>
                <Stack.Header.MenuAction isOn icon="square.grid.2x2">
                  Icons
                </Stack.Header.MenuAction>
                <Stack.Header.MenuAction icon="list.bullet">List</Stack.Header.MenuAction>
              </Stack.Header.Menu>
              {/** TODO: Display inline is missing - https://github.com/software-mansion/react-native-screens/pull/3396 */}
              <Stack.Header.Menu>
                {/** TODO: Subtitle is missing - https://github.com/software-mansion/react-native-screens/pull/3396 */}
                <Stack.Header.MenuAction isOn>Name</Stack.Header.MenuAction>
                <Stack.Header.MenuAction>Kind</Stack.Header.MenuAction>
                <Stack.Header.MenuAction>Date</Stack.Header.MenuAction>
                <Stack.Header.MenuAction>Size</Stack.Header.MenuAction>
                <Stack.Header.MenuAction>Tags</Stack.Header.MenuAction>
              </Stack.Header.Menu>
              {/** TODO: Display inline is missing - https://github.com/software-mansion/react-native-screens/pull/3396 */}
              <Stack.Header.Menu>
                <Stack.Header.MenuAction>View options</Stack.Header.MenuAction>
              </Stack.Header.Menu>
            </Stack.Header.Menu>
            <Stack.Header.Button icon="magnifyingglass" />
          </Stack.Header.Right>
        </Stack.Header>
      </Stack.Screen>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ alignItems: 'center', gap: 16 }}
        contentInsetAdjustmentBehavior="automatic"
      />
    </>
  );
};

export default AppleFiles;

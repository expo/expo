import { Stack } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';

const AppleFiles = () => {
  return (
    <>
      <Header />
      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ alignItems: 'center', gap: 16 }}
        contentInsetAdjustmentBehavior="automatic"
      />
    </>
  );
};

const Header = () => (
  <Stack.Header style={{ backgroundColor: 'transparent' }}>
    <Stack.Header.BackButton hidden />
    <Stack.Header.Title>Apple Files</Stack.Header.Title>
    <Stack.Header.Left>
      <Stack.Header.Button icon="arrow.left" />
      <Stack.Header.Button icon="arrow.right" />
    </Stack.Header.Left>
    <Stack.Header.Right>
      <Stack.Header.Menu icon="ellipsis" separateBackground>
        <Stack.Header.MenuAction icon="doc.text.viewfinder">Scan Documents</Stack.Header.MenuAction>
        <Stack.Header.MenuAction icon="network">Connect to Server</Stack.Header.MenuAction>
        <Stack.Header.Menu inline>
          <Stack.Header.MenuAction isOn icon="square.grid.2x2">
            Icons
          </Stack.Header.MenuAction>
          <Stack.Header.MenuAction icon="list.bullet">List</Stack.Header.MenuAction>
        </Stack.Header.Menu>
        <Stack.Header.Menu inline>
          <Stack.Header.MenuAction isOn subtitle="Ascending">
            Name
          </Stack.Header.MenuAction>
          <Stack.Header.MenuAction>Kind</Stack.Header.MenuAction>
          <Stack.Header.MenuAction>Date</Stack.Header.MenuAction>
          <Stack.Header.MenuAction>Size</Stack.Header.MenuAction>
          <Stack.Header.MenuAction>Tags</Stack.Header.MenuAction>
        </Stack.Header.Menu>
        <Stack.Header.Menu inline>
          <Stack.Header.MenuAction>View options</Stack.Header.MenuAction>
        </Stack.Header.Menu>
      </Stack.Header.Menu>
      <Stack.Header.Button icon="magnifyingglass" />
    </Stack.Header.Right>
  </Stack.Header>
);
export default AppleFiles;

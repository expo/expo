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
  <>
    <Stack.Header style={{ backgroundColor: 'transparent' }} />
    <Stack.Screen.BackButton hidden />
    <Stack.Screen.Title>Apple Files</Stack.Screen.Title>
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button icon="sf:arrow.left" />
      <Stack.Toolbar.Button icon="sf:arrow.right" />
    </Stack.Toolbar>
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu icon="sf:ellipsis" separateBackground>
        <Stack.Toolbar.MenuAction icon="sf:doc.text.viewfinder">
          Scan Documents
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.MenuAction icon="sf:network">Connect to Server</Stack.Toolbar.MenuAction>
        <Stack.Toolbar.Menu inline>
          <Stack.Toolbar.MenuAction isOn icon="sf:square.grid.2x2">
            Icons
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction icon="sf:list.bullet">List</Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Menu inline>
          <Stack.Toolbar.MenuAction isOn subtitle="Ascending">
            Name
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction>Kind</Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction>Date</Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction>Size</Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction>Tags</Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Menu inline>
          <Stack.Toolbar.MenuAction>View options</Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar.Menu>
      <Stack.Toolbar.Button icon="sf:magnifyingglass" />
    </Stack.Toolbar>
  </>
);
export default AppleFiles;

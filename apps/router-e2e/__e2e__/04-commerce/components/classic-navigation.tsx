'use client';

// In App.js in a new project

import * as React from 'react';
import { Text } from 'react-native';
import { createStaticNavigation, useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { loadDetailScreen, loadScreen } from './server-fns';

function LoadableScreen({ loadAsync, fallback }) {
  const [isPending, startTransition] = React.useTransition();
  const [contents, setContents] = React.useState<React.ReactElement | Promise<React.ReactElement>>(
    <></>
  );

  React.useEffect(() => {
    startTransition(() => {
      setContents(loadAsync());
    });
  }, []);

  return <>{isPending ? fallback : contents}</>;
}

function HomeScreen() {
  return <LoadableScreen loadAsync={loadScreen} fallback={<Text>Loading...</Text>} />;
}

function DetailScreen() {
  const { params } = useRoute();
  return (
    <LoadableScreen
      loadAsync={loadDetailScreen.bind(null, { params })}
      fallback={<Text>Loading...</Text>}
    />
  );
}

const RootStack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
    detail: DetailScreen,
  },
});

const Navigation = createStaticNavigation(RootStack);

export default function App() {
  return <Navigation />;
}

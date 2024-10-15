'use client';

// In App.js in a new project

import * as React from 'react';
import { PlatformColor, ScrollView, Text, View } from 'react-native';
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

import Skeleton, { SkeletonBox } from './skeleton';
import { ScreenOptions } from './react-navigation';

function Loading() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustsScrollIndicatorInsets>
      <View style={{ padding: 16, gap: 8 }}>
        <SkeletonBox width={100} height={50} />
        <Skeleton />
        <Skeleton />
      </View>
    </ScrollView>
  );
}

function HomeScreen() {
  return <LoadableScreen loadAsync={loadScreen} fallback={<Loading />} />;
}

function DetailScreen() {
  const { params } = useRoute();
  return (
    <LoadableScreen
      loadAsync={loadDetailScreen.bind(null, { params })}
      fallback={
        <>
          <ScreenOptions title="..." />
          <Loading />
        </>
      }
    />
  );
}

const RootStack = createNativeStackNavigator({
  screenOptions: {
    headerTransparent: true,
    headerLargeTitle: true,
    headerBlurEffect: 'prominent',
    headerShadowVisible: true,
    headerLargeTitleShadowVisible: false,
    headerStyle: {
      // Hack to ensure the collapsed small header shows the shadow / border.
      backgroundColor: 'rgba(255,255,255,0.01)',
    },
    // @ts-expect-error
    headerLargeStyle: {
      backgroundColor: PlatformColor('systemGroupedBackgroundColor'), // Color of your background
    },
  },
  screens: {
    Home: HomeScreen,
    detail: DetailScreen,
  },
});

const Navigation = createStaticNavigation(RootStack);

export default function App() {
  return <Navigation />;
}

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

function DetailsLoading() {
  return (
    <>
      <ScreenOptions title="..." />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustsScrollIndicatorInsets>
        <View style={{ padding: 16, gap: 12, gap: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 300 }}>
              <SkeletonBox width={200} height={200} />
            </View>
          </View>
          <Skeleton
            style={{
              height: 100,
              borderCurve: 'continuous',

              borderRadius: 10,
            }}
          />
          <Skeleton
            delay={100}
            style={{
              marginTop: 64,
              height: 200,
              borderCurve: 'continuous',

              borderRadius: 10,
            }}
          />
        </View>
      </ScrollView>
    </>
  );
}

function DetailScreen() {
  const { params } = useRoute();
  //   return <DetailsLoading />;
  return (
    <LoadableScreen
      loadAsync={loadDetailScreen.bind(null, { params })}
      fallback={<DetailsLoading />}
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

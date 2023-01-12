import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

const libs = require.context('../../../packages', true, /.*\.demo\.[jt]sx?/, 'lazy');
// const libs = require.context('../../../packages', true, /.*\.demo\.[jt]sx?/, 'lazy');

export function getPackages() {
  return libs
    .keys()
    .map((path) => {
      const [pkg] = path.replace(/^\.\//, '').split('/');

      return pkg;
    })
    .concat(['expo-blur']);
}

function MissingRoute({ route }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text style={{ color: 'white', fontSize: 24 }}>
        No <Text style={{ color: '#E37DBB' }}>default export</Text> for {route}
      </Text>
    </View>
  );
}

export function getComponent(library: string) {
  const key = libs.keys().find((path) => {
    const [pkg] = path.replace(/^\.\//, '').split('/');

    return pkg === library;
  });

  if (!key) {
    return null;
  }

  const Load = React.lazy(async () => {
    const lib = await libs(key);
    if (lib.default) {
      return lib;
    }
    return {
      default: () => <MissingRoute route={key} />,
    };
  });

  return () => (
    <React.Suspense fallback={<ActivityIndicator />}>
      <Load />
    </React.Suspense>
  );
}

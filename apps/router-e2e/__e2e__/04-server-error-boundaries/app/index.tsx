'use client';

import { ErrorBoundary } from 'expo-router';
import { ReactServerError } from 'expo-router/build/rsc/router/errors';
import { Try } from 'expo-router/build/views/Try';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { actionThrowsBundlerErrorAsync } from '../components/bundler-error-actions';
import { actionThrowsErrorAsync } from '../components/server-actions';

function TestableErrorBoundary({ error }: { error: Error }) {
  if (error instanceof ReactServerError) {
    const headers =
      'headers' in error && error.headers instanceof Headers
        ? Object.fromEntries(error.headers.entries())
        : null;

    return (
      <View>
        <Text testID="error-type">{error.code}</Text>
        <Text testID="error-url">{error.url}</Text>
        <Text testID="error-statusCode">{error.statusCode}</Text>
        <Text testID="error-headers">{JSON.stringify(headers)}</Text>
        <Text testID="error-message">{error.message}</Text>
      </View>
    );
  }

  return <Text testID="error-unknown">Caught error: {error.message}</Text>;
}

export default function ServerActionTest() {
  return (
    <View style={{ flex: 1, gap: 16 }}>
      <ToggleMount testID="button-error-in-server-action" title="Throw Error in Server Action">
        <ServerActionErrorTest errorBoundary={TestableErrorBoundary} />
      </ToggleMount>

      <ToggleMount
        testID="button-error-with-default-boundary"
        title="Throw Error in Server Action with default boundary">
        <ServerActionErrorTest errorBoundary={ErrorBoundary} />
      </ToggleMount>

      <ToggleMount testID="button-bundler-error" title="Bundler Error">
        <BundlerErrorTest />
      </ToggleMount>

      {/* <ToggleMount title="API Route Error">
        <ApiRouteTest />
      </ToggleMount> */}
    </View>
  );
}

function ToggleMount({
  title,
  children,
  testID,
}: {
  title: string;
  children: React.ReactNode;
  testID: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  return (
    <View style={{ flex: 1, borderWidth: 1, padding: 16, borderStyle: 'dashed' }}>
      <Text>{title}</Text>
      <Text testID={testID} onPress={() => setMounted(!mounted)}>
        Toggle Mount
      </Text>
      <ScrollView>{mounted ? children : null}</ScrollView>
    </View>
  );
}

function ServerActionErrorTest({ errorBoundary }: { errorBoundary?: typeof ErrorBoundary }) {
  const memo = useMemo(() => actionThrowsErrorAsync(), []);
  return (
    <Try catch={errorBoundary}>
      <React.Suspense fallback={<ActivityIndicator />}>{memo}</React.Suspense>
    </Try>
  );
}

function BundlerErrorTest() {
  const memo = useMemo(() => actionThrowsBundlerErrorAsync(), []);
  return (
    <Try catch={TestableErrorBoundary}>
      <React.Suspense fallback={<ActivityIndicator />}>{memo}</React.Suspense>
    </Try>
  );
}

// function ApiRouteTest() {
//   const memo = useMemo(
//     () =>
//       fetch('/api/top-level-error')
//         .then((res) => res.text())
//         .then((text) => <Text>{text}</Text>),
//     []
//   );
//   return (
//     <Try catch={TestableErrorBoundary}>
//       <React.Suspense fallback={<ActivityIndicator />}>{memo}</React.Suspense>
//     </Try>
//   );
// }

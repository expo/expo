import Head from 'expo-router/head';
import React from 'react';
import { Text } from 'react-native';

export default function Page() {
  return (
    <>
      <Head>
        <title>App A: About | Website</title>
        <meta name="description" content="About page" />
      </Head>
      <Text testID="content">App A: About</Text>
    </>
  );
}

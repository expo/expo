import Head from 'expo-router/head';
import React from 'react';
import { Text } from 'react-native';

export default function Page() {
  return (
    <>
      <Head>
        <title>About | Website</title>
        <meta name="description" content="About page" />
      </Head>
      <Text testID="content">About</Text>
    </>
  );
}

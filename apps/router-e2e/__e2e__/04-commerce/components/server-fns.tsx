'use server';

import { ScrollView, Text } from 'react-native';
import { Link, ScreenOptions } from './react-navigation';

export async function loadScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustsScrollIndicatorInsets>
      <Text>Hey</Text>
      <Link screen="detail" href={'/detail'}>
        Detail
      </Link>
    </ScrollView>
  );
}

export async function loadDetailScreen({ params }) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return (
    <>
      <ScreenOptions title="Details!" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustsScrollIndicatorInsets>
        <Text>Details: {JSON.stringify(params ?? {})}</Text>
      </ScrollView>
    </>
  );
}

'use server';

import { Text } from 'react-native';
import { Link } from './react-navigation';

export async function loadScreen() {
  return (
    <>
      <Text>Hey</Text>
      <Link screen="detail" href={'/detail'}>
        Detail
      </Link>
    </>
  );
}

export async function loadDetailScreen({ params }) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return <Text>Details: {JSON.stringify(params ?? {})}</Text>;
}

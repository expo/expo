import { Text } from 'react-native';

function fail(): never {
  throw new Error('Thrown from a loader');
}

export async function loader() {
  fail();
}

export default function LoaderError() {
  return <Text>Unreachable</Text>;
}

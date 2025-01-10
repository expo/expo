import { Text } from 'react-native';

// export const unstable_settings = {
//   render: 'static',
// };

export async function generateStaticParams() {
  return [{ color: 'red' }, { color: 'blue' }];
}

export default function ColorRoute({ color }) {
  return <Text testID="color">{color}</Text>;
}

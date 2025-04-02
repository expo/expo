import { Text, View } from 'react-native';

export default function Page() {
  const func = function () {};

  console.warn('foo:' + new Error().stack);
  return (
    <>
      <Text testID="index-text" style={{ fontFamily: 'sweet' }}>
        Index
      </Text>

      {/* <View>xyz</View>
      {Array.from({ length: 3 }, (_, i) => (
        <Text testID={`index-text-${i}`} style={{ fontFamily: 'sweet' }}>
          Index {i}
        </Text>
      ))}

      {func} */}

      {/* <InvalidAsyncClientComponent /> */}
    </>
  );
}

// async function InvalidAsyncClientComponent() {
//   return <Text>Invalid</Text>;
// }

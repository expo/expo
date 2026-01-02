import { Text } from 'react-native';
import { Image } from 'expo-image';

export default function Page() {
  return (
    <>
      <Text testID="index-text" style={{ fontFamily: 'sweet' }}>
        Index
      </Text>
      <Image
        source="sf:star"
        contentFit="contain"
        style={{
          width: 36,
          aspectRatio: 1,
          height: 36 * 2,
          backgroundColor: 'blue',
          tintColor: 'orange',
          fontWeight: '600',
        }}
      />
    </>
  );
}

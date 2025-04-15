import { Text } from 'react-native';

export default function Page() {
  return (
    <>
      <Text testID="index-text" style={{ fontFamily: 'sweet' }}>
        Index
      </Text>
      <div>{process.env.EXPO_PUBLIC_MY_VALUE}</div>
    </>
  );
}

//////

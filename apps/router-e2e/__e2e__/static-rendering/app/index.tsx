import { Text } from 'react-native';

export default function Page() {
  const env = {
    EXPO_PUBLIC_FOO: process.env.EXPO_PUBLIC_FOO,
  };
  return (
    <>
      <Text testID="index-text" style={{ fontFamily: 'sweet' }}>
        Index
      </Text>

      {Object.keys(env).map((key) => (
        <Text key={key} testID={key}>
          {key}: {env[key]}
        </Text>
      ))}
    </>
  );
}

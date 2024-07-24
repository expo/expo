import { Image } from 'react-native';

export default function Page() {
  return (
    <>
      <Image source={require('../../../assets/icon.png')} />
      <Image source={require('expo-router/assets/file.png')} />
    </>
  );
}

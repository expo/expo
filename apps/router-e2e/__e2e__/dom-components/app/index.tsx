import { View } from 'react-native';
import Actions from '../components/02-actions';
import LocalAsset from '../components/03-local-asset';

export default function Page() {
  return (
    <View style={{ flex: 1, padding: 56 }}>
      <Actions
        showAlert={(time) => {
          alert('Hello, world! ' + time);
        }}
        throwError={() => {
          throw new Error('hey');
        }}
        getNativeSettings={async () => {
          return 'native setting';
        }}
      />

      <LocalAsset />
    </View>
  );
}

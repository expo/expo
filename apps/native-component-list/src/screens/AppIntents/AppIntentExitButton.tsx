import { useRouter } from 'expo-router';

import Button from '../../components/Button';

export function AppIntentExitButton() {
  const router = useRouter();

  const onPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/apis');
  };

  return <Button title="Back" onPress={onPress} />;
}

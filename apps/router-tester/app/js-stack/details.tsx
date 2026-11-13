import { useRouter } from 'expo-router';

import { DemoButton, DemoScreen } from '../../components/demo-screen';

export default function Details() {
  const router = useRouter();

  return (
    <DemoScreen title="Details">
      <DemoButton testID="e2e-go-back" onPress={() => router.back()} title="Go Back" />
      <DemoButton testID="e2e-goto-modal" href="/js-stack/modal" title="Open Modal" />
    </DemoScreen>
  );
}

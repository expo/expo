import { useRouter } from 'expo-router';

import { DemoButton, DemoScreen } from '../../components/demo-screen';

export default function Modal() {
  const router = useRouter();

  return (
    <DemoScreen title="Modal">
      <DemoButton testID="e2e-dismiss" onPress={() => router.back()} title="Dismiss" />
    </DemoScreen>
  );
}

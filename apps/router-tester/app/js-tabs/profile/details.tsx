import { useRouter } from 'expo-router';

import { DemoButton, DemoScreen } from '../../../components/demo-screen';

export default function ProfileDetails() {
  const router = useRouter();

  return (
    <DemoScreen title="Profile Details">
      <DemoButton testID="e2e-go-back" onPress={() => router.back()} title="Go Back" />
    </DemoScreen>
  );
}

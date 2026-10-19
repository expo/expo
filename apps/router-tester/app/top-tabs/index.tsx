import { DemoButton, DemoScreen } from '../../components/demo-screen';

export default function Home() {
  return (
    <DemoScreen title="Home">
      <DemoButton testID="e2e-goto-profile" href="/top-tabs/profile" title="Go to Profile" />
      <DemoButton testID="e2e-goto-settings" href="/top-tabs/settings" title="Go to Settings" />
    </DemoScreen>
  );
}

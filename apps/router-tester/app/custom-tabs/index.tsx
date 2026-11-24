import { DemoButton, DemoScreen } from '../../components/demo-screen';

export default function Home() {
  return (
    <DemoScreen title="Home">
      <DemoButton testID="e2e-goto-library" href="/custom-tabs/library" title="Go to Library" />
      <DemoButton testID="e2e-goto-settings" href="/custom-tabs/settings" title="Go to Settings" />
    </DemoScreen>
  );
}

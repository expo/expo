import { DemoButton, DemoScreen } from '../../components/demo-screen';

export default function Library() {
  return (
    <DemoScreen title="Library">
      <DemoButton testID="e2e-goto-home" href="/custom-tabs" title="Go to Home" />
      <DemoButton testID="e2e-goto-settings" href="/custom-tabs/settings" title="Go to Settings" />
    </DemoScreen>
  );
}

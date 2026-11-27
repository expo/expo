import { DemoButton, DemoScreen } from '../../components/demo-screen';

export default function Settings() {
  return (
    <DemoScreen title="Settings">
      <DemoButton testID="e2e-goto-home" href="/js-tabs" title="Go to Home" />
    </DemoScreen>
  );
}

import { DemoButton, DemoScreen } from '../../components/demo-screen';

export default function Profile() {
  return (
    <DemoScreen title="Profile">
      <DemoButton testID="e2e-goto-home" href="/top-tabs" title="Go to Home" />
      <DemoButton testID="e2e-goto-hidden" href="/top-tabs/hidden" title="Go to Hidden" />
    </DemoScreen>
  );
}

import { DemoButton, DemoScreen } from '../../../components/demo-screen';

export default function Profile() {
  return (
    <DemoScreen title="Profile">
      <DemoButton
        testID="e2e-goto-profile-details"
        href="/js-tabs/profile/details"
        title="Go to Profile Details"
      />
      <DemoButton testID="e2e-goto-home" href="/js-tabs" title="Go to Home" />
      <DemoButton testID="e2e-goto-hidden" href="/js-tabs/hidden" title="Go to Hidden" />
    </DemoScreen>
  );
}

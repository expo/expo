import { DemoButton, DemoScreen } from '../../components/demo-screen';

export default function Home() {
  return (
    <DemoScreen title="Home">
      <DemoButton
        testID="e2e-goto-profile-details"
        href="/js-tabs/profile/details"
        title="Go to Profile Details"
      />
      <DemoButton
        testID="e2e-goto-profile-details-anchor"
        href="/js-tabs/profile/details"
        withAnchor
        title="Go to Profile Details with anchor"
      />
      <DemoButton testID="e2e-goto-profile" href="/js-tabs/profile" title="Go to Profile" />
      <DemoButton testID="e2e-goto-settings" href="/js-tabs/settings" title="Go to Settings" />
    </DemoScreen>
  );
}

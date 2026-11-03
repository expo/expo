import { DemoButton, DemoScreen } from '../../components/demo-screen';

export default function Home() {
  return (
    <DemoScreen title="Home">
      <DemoButton testID="e2e-goto-details" href="/js-stack/details" title="Go to Details" />
      <DemoButton testID="e2e-goto-modal" href="/js-stack/modal" title="Open Modal" />
    </DemoScreen>
  );
}

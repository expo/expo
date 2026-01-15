import DocumentationPage from '~/components/DocumentationPage';
import { DevicesImageMasks } from '~/ui/components/Home/resources';
import {
  QuickStart,
  CommandLineTools,
  DiscoverMore,
  ExploreAPIs,
  Talks,
  JoinTheCommunity,
} from '~/ui/components/Home/sections';
import { ExploreExamples } from '~/ui/components/Home/sections/ExploreExamples';
import { StateOfRNBanner } from '~/ui/components/StateOfRNBanner';

function Home() {
  return (
    <DocumentationPage
      hideTOC
      hideFromSearch
      description="Build one JavaScript/TypeScript project that runs natively on all your users' devices.">
      <div className="h-0">
        <DevicesImageMasks />
      </div>
      <StateOfRNBanner />
      <QuickStart />
      <CommandLineTools />
      <DiscoverMore />
      <ExploreAPIs />
      <ExploreExamples />
      <Talks />
      <JoinTheCommunity />
    </DocumentationPage>
  );
}

export default Home;

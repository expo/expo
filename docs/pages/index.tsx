import DocumentationPage from '~/components/DocumentationPage';
import { AppJSBanner } from '~/ui/components/AppJSBanner';
import { EASHostingShoutoutBanner } from '~/ui/components/EASHostingShoutoutBanner';
import { DevicesImageMasks } from '~/ui/components/Home/resources';
import {
  QuickStart,
  DiscoverMore,
  ExploreAPIs,
  Talks,
  JoinTheCommunity,
} from '~/ui/components/Home/sections';
import { ExploreExamples } from '~/ui/components/Home/sections/ExploreExamples';

function Home() {
  return (
    <DocumentationPage
      hideTOC
      hideFromSearch
      description="Build one JavaScript/TypeScript project that runs natively on all your users' devices.">
      <div className="h-0">
        <DevicesImageMasks />
      </div>
      <AppJSBanner />
      <EASHostingShoutoutBanner />
      <QuickStart />
      <DiscoverMore />
      <ExploreAPIs />
      <ExploreExamples />
      <Talks />
      <JoinTheCommunity />
    </DocumentationPage>
  );
}

export default Home;

import DocumentationPage from '~/components/DocumentationPage';
import { EASHostingShoutoutBanner } from '~/ui/components/EASHostingShoutoutBanner';
import { DevicesImageMasks } from '~/ui/components/Home/resources';
import {
  QuickStart,
  DiscoverMore,
  ExploreAPIs,
  Talks,
  JoinTheCommunity,
} from '~/ui/components/Home/sections';

function Home() {
  return (
    <DocumentationPage
      hideTOC
      hideFromSearch
      description="Build one JavaScript/TypeScript project that runs natively on all your users' devices.">
      <div className="h-0">
        <DevicesImageMasks />
      </div>
      <EASHostingShoutoutBanner />
      <QuickStart />
      <DiscoverMore />
      <ExploreAPIs />
      <Talks />
      <JoinTheCommunity />
    </DocumentationPage>
  );
}

export default Home;

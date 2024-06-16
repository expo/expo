import DocumentationPage from '~/components/DocumentationPage';
import { DevicesImageMasks } from '~/ui/components/Home/resources';
import {
  QuickStart,
  LearnMore,
  ExploreAPIs,
  Talks,
  JoinTheCommunity,
} from '~/ui/components/Home/sections';

function Home() {
  return (
    <DocumentationPage hideTOC hideFromSearch>
      <div className="h-0">
        <DevicesImageMasks />
      </div>
      <QuickStart />
      <LearnMore />
      <ExploreAPIs />
      <Talks />
      <JoinTheCommunity />
    </DocumentationPage>
  );
}

export default Home;

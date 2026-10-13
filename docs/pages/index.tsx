import DocumentationPage from '~/components/DocumentationPage';
import { AppJSBanner } from '~/ui/components/AppJSBanner';
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

function Home() {
  return (
    <DocumentationPage
      hideTOC
      hideFromSearch
      description="Documentation for Expo, the agentic mobile infrastructure that agents and teams can use to build, validate, deploy, and monitor mobile apps.">
      <div className="h-0">
        <DevicesImageMasks />
      </div>
      <AppJSBanner />
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

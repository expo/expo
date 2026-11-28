import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';
import { RouteLink, RouteLinks } from '@/components/RouteLinks';

export default function NoLoaderRoute() {
  return (
    <Page title="No loader" testID="loaders-no-loader">
      <RouteDetails />
      <RouteLinks>
        <RouteLink href="/loaders" />
      </RouteLinks>
    </Page>
  );
}

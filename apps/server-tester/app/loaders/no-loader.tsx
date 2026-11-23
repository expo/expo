import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export default function NoLoaderRoute() {
  return (
    <Page title="No loader" testID="loaders-no-loader">
      <RouteDetails />
    </Page>
  );
}

import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export default function RoutingIndexRoute() {
  return (
    <Page title="Group index" testID="alpha-index">
      <RouteDetails />
    </Page>
  );
}

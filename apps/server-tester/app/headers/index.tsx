import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export default function HeadersRoute() {
  return (
    <Page title="Headers" testID="headers-index">
      <RouteDetails />
    </Page>
  );
}

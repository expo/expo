import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export default function RedirectsRoute() {
  return (
    <Page title="Redirects and rewrites" testID="redirects-index">
      <RouteDetails />
    </Page>
  );
}

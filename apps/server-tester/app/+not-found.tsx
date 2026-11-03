import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export default function NotFoundRoute() {
  return (
    <Page title="404" testID="custom-404">
      <RouteDetails />
    </Page>
  );
}

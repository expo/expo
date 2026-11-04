import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export default function RedirectTargetRoute() {
  return (
    <Page title="Redirect target" testID="middleware-redirect-target">
      <RouteDetails />
    </Page>
  );
}

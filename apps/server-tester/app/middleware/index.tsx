import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

// Add `?e2e=<scenario>` to a full page load to run a scenario from `app/+middleware.ts`.
export default function MiddlewareRoute() {
  return (
    <Page title="Middleware" testID="middleware-index">
      <RouteDetails />
    </Page>
  );
}

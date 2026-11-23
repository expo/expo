import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

// Throws while the route module loads, so the dev server shows its error page.
if (process.env.E2E_ROUTER_THROW_ON_LOAD === 'true') {
  throw new Error('server-tester: route module threw while loading');
}

export default function ThrowOnLoadRoute() {
  return (
    <Page title="Throw on load" testID="errors-throw-on-load">
      <RouteDetails />
    </Page>
  );
}

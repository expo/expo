import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export default function HmrNoLoaderRoute() {
  return (
    <Page title="HMR no loader" testID="hmr-no-loader">
      <RouteDetails />
    </Page>
  );
}

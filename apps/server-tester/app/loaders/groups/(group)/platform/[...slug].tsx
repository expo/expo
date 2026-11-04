import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export default function PlatformCatchAllFallbackRoute() {
  return (
    <Page title="Platform catch-all fallback" testID="loaders-platform-catch-all-fallback">
      <RouteDetails />
    </Page>
  );
}

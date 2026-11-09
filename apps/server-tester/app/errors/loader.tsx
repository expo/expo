import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

function fail(): never {
  throw new Error('Thrown from a loader');
}

export async function loader() {
  if (process.env.TEST_THROW_ERROR === 'true') {
    fail();
  }
}

export default function LoaderErrorRoute() {
  return (
    <Page title="Loader error" testID="errors-loader">
      <RouteDetails />
    </Page>
  );
}

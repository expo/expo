import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

// A GET request renders this page. A POST request runs `with-page+api.ts`.
export default function WithPageRoute() {
  return (
    <Page title="Page with API handler" testID="alpha-text">
      <RouteDetails />
    </Page>
  );
}

import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';
import { RouteLink, RouteLinks } from '@/components/RouteLinks';

export default function NotFoundRoute() {
  return (
    <Page title="404" testID="custom-404">
      <RouteDetails />
      <RouteLinks>
        <RouteLink testID="not-found-home" href="/">
          Go home
        </RouteLink>
      </RouteLinks>
    </Page>
  );
}

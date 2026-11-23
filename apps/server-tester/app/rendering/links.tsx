import { Page } from '@/components/Page';
import { RouteLink, RouteLinks } from '@/components/RouteLinks';

export default function LinksRoute() {
  return (
    <Page title="Links" testID="rendering-links">
      <RouteLinks>
        <RouteLink testID="links-one" href="/rendering/about">
          Link to about
        </RouteLink>
      </RouteLinks>
    </Page>
  );
}

import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export function generateStaticParams() {
  return [{ postId: 'abc' }];
}

export default function StaticPostRoute() {
  return (
    <Page title="Static post" testID="static-post-text">
      <RouteDetails />
    </Page>
  );
}

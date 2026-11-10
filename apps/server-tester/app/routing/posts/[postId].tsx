import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export default function PostRoute() {
  return (
    <Page title="Post" testID="post-text">
      <RouteDetails />
    </Page>
  );
}

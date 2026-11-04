import type { Href } from 'expo-router';
import { Platform } from 'react-native';

import { Json } from '@/components/Json';
import { Page } from '@/components/Page';
import { RouteLink, RouteLinks } from '@/components/RouteLinks';
import { Section } from '@/components/Section';
import { Table, TableRow } from '@/components/Table';

export default function HomeRoute() {
  return (
    <Page title="Server Tester" testID="index-text">
      <Table>
        <TableRow label="Platform">
          <Json value={Platform.OS} testID="platform-result" />
        </TableRow>
      </Table>
      <Section title="API routes">
        <RouteLinks>
          <RouteLink href="/api/checks/get-methods">GET /api/methods</RouteLink>
          <RouteLink href="/api/checks/post-methods">POST /api/methods</RouteLink>
          <RouteLink href="/api/checks/get-dynamic">GET /api/abc</RouteLink>
          <RouteLink href="/api/checks/get-spread">GET /api/1/2/3</RouteLink>
          <RouteLink href="/api/checks/post-json">POST /api/json</RouteLink>
          <RouteLink href="/api/checks/get-runtime">GET /api/runtime</RouteLink>
          <RouteLink href="/api/with-page" />
        </RouteLinks>
      </Section>
      <Section title="Loaders">
        <RouteLinks>
          <RouteLink href="/loaders" />
          <RouteLink href="/loaders/second" />
          <RouteLink href="/loaders/slow" />
          <RouteLink href="/loaders/env" />
          <RouteLink href="/loaders/request" />
          <RouteLink href="/loaders/response" />
          <RouteLink href="/loaders/meta" />
          <RouteLink href="/loaders/error" />
          <RouteLink href="/loaders/no-loader" />
          <RouteLink href="/loaders/large-suspense" />
          <RouteLink href="/loaders/nested" />
          <RouteLink href="/loaders/groups/(group)" />
          <RouteLink href="/loaders/groups/platform/alpha/beta" />
          <RouteLink href="/loaders/posts/static-post-1" />
          <RouteLink href="/loaders/posts/static-post-2" />
          <RouteLink href="/loaders/nullish/null" />
          <RouteLink href="/loaders/nullish/undefined" />
          <RouteLink href="/loaders/static-helper" />
          <RouteLink href="/loaders/server-helper" />
        </RouteLinks>
      </Section>
      <Section title="Middleware">
        <RouteLinks>
          <RouteLink href="/middleware" />
          <RouteLink href="/middleware/redirect-target" />
        </RouteLinks>
      </Section>
      <Section title="Routing">
        <RouteLinks>
          <RouteLink href="/routing" />
          <RouteLink href="/routing/beta" />
          <RouteLink href="/routing/multi-group" />
          <RouteLink href="/routing/posts/123" />
          <RouteLink href="/routing/static/posts/abc" />
          {/* The route does not exist on purpose, so typed routes reject it. */}
          <RouteLink href={'/clearly-missing' as Href} />
        </RouteLinks>
      </Section>
    </Page>
  );
}

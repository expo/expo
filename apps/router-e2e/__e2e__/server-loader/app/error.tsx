import { ErrorBoundaryProps, useLoaderData } from 'expo-router';
import { Suspense } from 'react';

import { Loading } from '../components/Loading';
import { SiteLinks, SiteLink } from '../components/SiteLink';
import { Table, TableRow } from '../components/Table';

export async function loader() {
  if (process.env.TEST_THROW_ERROR === 'true') {
    throw new Error('Intentional loader error for testing');
  }
}

export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  return (
    <>
      <Table>
        <TableRow label="Error" value={error.message} testID="error-message" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
      </SiteLinks>
    </>
  );
}

export default function ErrorRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <ErrorScreen />
    </Suspense>
  )
}

const ErrorScreen = () => {
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <Table>
        <TableRow label="This should not render" value={data} testID="should-not-render" />
      </Table>
    </>
  );
}

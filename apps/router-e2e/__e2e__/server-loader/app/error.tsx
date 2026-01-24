import { Text } from 'react-native';
import { ErrorBoundaryProps, useLoaderData } from 'expo-router';
import { Container } from '../components/Container';
import { SiteLinks, SiteLink } from '../components/SiteLink';
import { Table, TableRow } from '../components/Table';

export async function loader() {
  if (process.env.TEST_THROW_ERROR === 'true') {
    throw new Error('Intentional loader error for testing');
  }
}

export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  return (
    <Container>
      <Table>
        <TableRow label="Error" value={error.message} testID="error-message" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
      </SiteLinks>
    </Container>
  );
}

export default function ErrorRoute() {
  const data = useLoaderData<typeof loader>();
  return (
    <Container>
      <Text testID="should-not-render">This should not render</Text>
    </Container>
  );
}

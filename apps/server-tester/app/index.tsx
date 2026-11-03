import { Platform } from 'react-native';

import { Json } from '@/components/Json';
import { Page } from '@/components/Page';
import { Table, TableRow } from '@/components/Table';

export default function HomeRoute() {
  return (
    <Page title="Server Tester" testID="index-text">
      <Table>
        <TableRow label="Platform">
          <Json value={Platform.OS} testID="platform-result" />
        </TableRow>
      </Table>
    </Page>
  );
}

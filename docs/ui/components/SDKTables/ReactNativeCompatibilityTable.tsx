import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { TableHead, Row, Cell, Table, HeaderCell } from '~/ui/components/Table';

import { getThreeVersions } from './utils';

const { LATEST_VERSION } = versions;

export const ReactNativeCompatibilityTable = () => {
  const { version } = usePageApiVersion();
  const resolvedVersion =
    version === 'latest' || version === 'unversioned' ? LATEST_VERSION : version;
  const versionsToShow = getThreeVersions(resolvedVersion);

  return (
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Expo SDK version</HeaderCell>
          <HeaderCell>React Native version</HeaderCell>
          <HeaderCell>React Native Web version</HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {versionsToShow.map(version => (
          <Row key={version.sdk}>
            <Cell>{version.sdk}</Cell>
            <Cell>{version['react-native']}</Cell>
            <Cell>{version['react-native-web']}</Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  );
};

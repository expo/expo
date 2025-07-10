import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { TableHead, Row, Cell, Table, HeaderCell } from '~/ui/components/Table';
import { CODE } from '~/ui/components/Text';

import { getThreeVersions } from './utils';

const { LATEST_VERSION } = versions;

export const AndroidIOSCompatibilityTable = () => {
  const { version } = usePageApiVersion();
  const resolvedVersion =
    version === 'latest' || version === 'unversioned' ? LATEST_VERSION : version;
  const versionsToShow = getThreeVersions(resolvedVersion);

  return (
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Expo SDK version</HeaderCell>
          <HeaderCell>Android version</HeaderCell>
          <HeaderCell>
            <CODE>compileSdkVersion</CODE>
          </HeaderCell>
          <HeaderCell>iOS version</HeaderCell>
          <HeaderCell>Xcode version</HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {versionsToShow.map(version => (
          <Row key={version.sdk}>
            <Cell>{version.sdk}</Cell>
            <Cell>{version.android}</Cell>
            <Cell>{version.compileSdkVersion}</Cell>
            <Cell>{version.ios}</Cell>
            <Cell>{version.xcode}</Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  );
};

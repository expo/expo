import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { TableHead, Row, Cell, Table, HeaderCell } from '~/ui/components/Table';
import { FOOTNOTE } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

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
          <HeaderCell>React version</HeaderCell>
          <HeaderCell>React Native Web version</HeaderCell>
          <HeaderCell>
            <Tooltip.Root delayDuration={500}>
              <Tooltip.Trigger asChild>
                <span className="cursor-help">Node.js version (?)</span>
              </Tooltip.Trigger>
              <Tooltip.Content side="top" className="max-w-[300px]">
                <FOOTNOTE>
                  This is the recommended Node.js version. The Expo SDK is not strictly compatible
                  only with this version.
                </FOOTNOTE>
              </Tooltip.Content>
            </Tooltip.Root>
          </HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {versionsToShow.map(version => (
          <Row key={version.sdk}>
            <Cell>{version.sdk}</Cell>
            <Cell>{version['react-native']}</Cell>
            <Cell>{version['react']}</Cell>
            <Cell>{version['react-native-web']}</Cell>
            <Cell>{version['node']}</Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  );
};

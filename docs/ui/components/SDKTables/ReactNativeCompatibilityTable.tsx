import { InfoCircleDuotoneIcon } from '@expo/styleguide-icons/duotone/InfoCircleDuotoneIcon';
import { useState } from 'react';

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
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  return (
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Expo SDK version</HeaderCell>
          <HeaderCell>React Native version</HeaderCell>
          <HeaderCell>React version</HeaderCell>
          <HeaderCell>React Native Web version</HeaderCell>
          <HeaderCell>
            <div className="flex items-center gap-1.5">
              <span>Minimum Node.js version</span>
              <Tooltip.Root
                open={isTooltipOpen}
                onOpenChange={setIsTooltipOpen}
                delayDuration={100}>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTooltipOpen(!isTooltipOpen);
                    }}
                    className="inline-flex items-center justify-center rounded-full p-1 text-icon-secondary hover:text-icon-default focus:outline-none focus:ring-2 focus:ring-link focus:ring-offset-1 active:text-icon-default">
                    <InfoCircleDuotoneIcon className="icon-xs" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content
                  side="top"
                  className="max-w-[300px]"
                  sideOffset={8}
                  collisionPadding={{ left: 16, right: 16 }}>
                  <FOOTNOTE>
                    This is the minimum recommended Node.js version, and it corresponds with the
                    active LTS at the time of the SDK release. The Expo SDK is not strictly
                    compatible only with this version, but you should use the specified version or
                    higher.
                  </FOOTNOTE>
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
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

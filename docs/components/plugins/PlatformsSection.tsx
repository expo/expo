import { css } from '@emotion/react';
import { StatusFailedIcon, StatusSuccessIcon, StatusWaitingIcon, theme } from '@expo/styleguide';
import * as React from 'react';

import { H4 } from '~/components/base/headings';
import { ElementType } from '~/types/common';
import { Cell, HeaderCell, Row, Table, TableHead, TableLayout } from '~/ui/components/Table';

const STYLES_TITLE = css`
  margin-bottom: 1rem;
`;

const STYLES_LINK = css`
  text-decoration: none;
  display: grid;
  grid-template-columns: 20px auto;
  text-align: left;
  grid-gap: 8px;
  color: ${theme.link.default};
`;

const platforms = [
  { title: 'Android Device', propName: 'android' },
  { title: 'Android Emulator', propName: 'emulator' },
  { title: 'iOS Device', propName: 'ios' },
  { title: 'iOS Simulator', propName: 'simulator' },
  { title: 'Web', propName: 'web' },
];

type Platform = ElementType<typeof platforms>;
type IsSupported = boolean | undefined | { pending: string };

function getInfo(isSupported: IsSupported, { title }: Platform) {
  if (isSupported === true) {
    return {
      children: <StatusSuccessIcon color={theme.status.success} />,
      title: `${title} is supported`,
    };
  } else if (typeof isSupported === 'object') {
    return {
      children: (
        <a css={STYLES_LINK} target="_blank" href={isSupported.pending}>
          <StatusWaitingIcon color={theme.status.info} /> Pending
        </a>
      ),
      title: `${title} support is pending`,
    };
  }

  return {
    children: <StatusFailedIcon color={theme.status.error} />,
    title: `${title} is not supported`,
  };
}

type Props = {
  title?: string;
  ios?: boolean;
  android?: boolean;
  web?: boolean;
  simulator?: boolean;
  emulator?: boolean;
};

type PlatformProps = Omit<Props, 'title'>;

const PlatformsSection = (props: Props) => (
  <>
    <H4 css={STYLES_TITLE}>{props.title || 'Platform Compatibility'}</H4>
    <Table layout={TableLayout.Fixed}>
      <TableHead>
        <Row>
          {platforms.map(({ title }) => (
            <HeaderCell key={title}>{title}</HeaderCell>
          ))}
        </Row>
      </TableHead>
      <tbody>
        <Row>
          {platforms.map(platform => (
            <Cell
              key={platform.title}
              {...getInfo(props[platform.propName as keyof PlatformProps], platform)}
            />
          ))}
        </Row>
      </tbody>
    </Table>
  </>
);

export default PlatformsSection;

import { css } from '@emotion/react';
import { borderRadius, palette, theme, typography } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';
import { Col, ColProps } from 'react-grid-system';

import { P } from '~/ui/components/Text';

export type GridCellProps = ColProps & {
  style?: object;
};

export const GridCell = ({
  children,
  sm,
  md,
  xl,
  style,
  css,
}: PropsWithChildren<GridCellProps>) => (
  <Col css={[cellWrapperStyle, css]} sm={sm} md={md} xl={xl}>
    <div css={cellStyle} style={style}>
      {children}
    </div>
  </Col>
);

type APIGridCellProps = GridCellProps & {
  icon?: string | JSX.Element;
  title?: string;
  link?: string;
};

export const APIGridCell = ({
  icon,
  title,
  link,
  style,
  sm = 6,
  md = 3,
  xl = 3,
}: APIGridCellProps) => (
  <Col css={cellWrapperStyle} md={md} sm={sm} xl={xl}>
    <div css={[cellStyle, cellAPIStyle]} style={style}>
      <div css={cellIconWrapperStyle}>{icon}</div>
      <a href={link} css={cellTitleWrapperStyle}>
        {title}
        <span css={cellTitleArrow}>{'->'}</span>
      </a>
    </div>
  </Col>
);

type CommunityGridCellProps = APIGridCellProps & {
  description?: string;
  iconBackground?: string;
};

export const CommunityGridCell = ({
  icon,
  iconBackground = palette.light.gray['800'],
  title,
  link,
  description,
  style,
  md = 6,
}: CommunityGridCellProps) => (
  <Col css={cellWrapperStyle} md={md}>
    <div css={[cellCommunityStyle]} style={style}>
      <div css={[cellCommunityIconWrapperStyle, css({ backgroundColor: iconBackground })]}>
        {icon}
      </div>
      <div>
        <a href={link} css={cellCommunityTitleStyle}>
          {title}
        </a>
        <P css={cellCommunityDescriptionStyle}>{description}</P>
      </div>
    </div>
  </Col>
);

const cellWrapperStyle = css`
  padding-left: 0 !important;
  padding-right: 0 !important;
`;

const cellStyle = css({
  borderRadius: borderRadius.large,
  margin: 16,
  padding: 32,
  minHeight: 200,
  overflow: 'hidden',
  position: 'relative',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: theme.border.default,
});

const cellAPIStyle = css({
  backgroundColor: theme.background.secondary,
  padding: 0,
  overflow: 'hidden',
});

const cellIconWrapperStyle = css({
  display: 'flex',
  minHeight: 136,
  justifyContent: 'space-around',
  alignItems: 'center',
});

const cellTitleWrapperStyle = css({
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: theme.background.default,
  padding: 16,
  textDecoration: 'none',
  fontSize: 15,
  fontFamily: typography.fontStacks.medium,
  lineHeight: '30px',
  color: theme.text.default,
});

const cellTitleArrow = css({ float: 'right', fontSize: 18, color: theme.text.secondary });

const cellCommunityStyle = css({
  display: 'flex',
  margin: 16,
  flexDirection: 'row',
});

const cellCommunityIconWrapperStyle = css({
  height: 32,
  width: 32,
  minWidth: 32,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: borderRadius.large,
  marginRight: 16,
});

const cellCommunityTitleStyle = css({
  fontSize: 16,
  fontFamily: typography.fontStacks.medium,
  color: theme.text.default,
  textDecoration: 'none',
  marginBottom: 8,
});

const cellCommunityDescriptionStyle = css({ color: theme.text.secondary, marginTop: 4 });

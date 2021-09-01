import { css, SerializedStyles } from '@emotion/react';
import { borderRadius, theme, colors } from '@expo/styleguide';
import React, { PropsWithChildren } from 'react';
import { Col, ColProps } from 'react-grid-system';

import { Link } from '~/ui/components/Link';
import { P } from '~/ui/components/Text';
import { fontStacks } from '~/ui/foundations/typography';

type GridCellProps = ColProps & {
  style?: SerializedStyles;
};

export const GridCell = ({ children, md, style }: PropsWithChildren<GridCellProps>) => (
  <Col css={cellWrapperStyle} md={md}>
    <div css={[cellStyle, style]}>{children}</div>
  </Col>
);

type APIGridCellProps = GridCellProps & {
  icon?: string;
  title?: string;
  link?: string;
};

export const APIGridCell = ({ md, icon, title, link, style }: APIGridCellProps) => (
  <Col css={cellWrapperStyle} md={md}>
    <div css={[cellStyle, cellAPIStyle, style]}>
      <div css={cellIconWrapperStyle}>{icon}</div>
      <div css={cellTitleWrapperStyle}>
        <Link href={link} css={cellTitleStyle}>
          {title}
          <span css={cellTitleArrow}>{'->'}</span>
        </Link>
      </div>
    </div>
  </Col>
);

type CommunityGridCellProps = APIGridCellProps & {
  description?: string;
  iconBackground?: string;
};

export const CommunityGridCell = ({
  md,
  icon,
  iconBackground = colors.gray['800'],
  title,
  link,
  description,
  style,
}: CommunityGridCellProps) => (
  <Col css={cellWrapperStyle} md={md}>
    <div css={[cellCommunityStyle, style]}>
      <div css={[cellCommunityIconWrapperStyle, css({ backgroundColor: iconBackground })]}>
        {icon}
      </div>
      <div>
        <Link href={link} css={cellCommunityTitleStyle}>
          {title}
        </Link>
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
});

const cellAPIStyle = css({
  backgroundColor: theme.background.secondary,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: theme.border.default,
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
  backgroundColor: theme.background.default,
  padding: 16,
});

const cellTitleStyle = css({
  fontSize: 15,
  fontFamily: fontStacks.bold,
  lineHeight: '30px',
  color: theme.text.default,
  textDecoration: 'none',
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
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  borderRadius: borderRadius.large,
  marginRight: 16,
});

const cellCommunityTitleStyle = css({
  fontSize: 16,
  fontFamily: fontStacks.bold,
  color: theme.text.default,
  textDecoration: 'none',
  marginBottom: 8,
});

const cellCommunityDescriptionStyle = css({ color: theme.text.secondary, marginTop: 4 });

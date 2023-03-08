import { css } from '@emotion/react';
import { shadows, theme, typography } from '@expo/styleguide';
import { borderRadius, breakpoints, palette, spacing } from '@expo/styleguide-base';
import { ArrowRightIcon, ArrowUpRightIcon } from '@expo/styleguide-icons';
import { PropsWithChildren } from 'react';
import { Col, ColProps } from 'react-grid-system';

import { A, P } from '~/ui/components/Text';

const CustomCol = ({ children, sm, md, lg, xl, xxl }: PropsWithChildren<ColProps>) => (
  <>
    <Col css={cellWrapperStyle} sm={sm} md={md} lg={lg} xl={xl} xxl={xxl}>
      {children}
    </Col>
    <div css={mobileCellWrapperStyle}>{children}</div>
  </>
);

export const GridCell = ({
  children,
  sm,
  md,
  lg,
  xl,
  xxl,
  className,
}: PropsWithChildren<ColProps>) => (
  <CustomCol css={cellWrapperStyle} sm={sm} md={md} lg={lg} xl={xl} xxl={xxl}>
    <div css={cellStyle} className={className}>
      {children}
    </div>
  </CustomCol>
);

type APIGridCellProps = ColProps & {
  icon?: string | JSX.Element;
  title?: string;
  link?: string;
};

export const APIGridCell = ({
  icon,
  title,
  link,
  className,
  sm = 6,
  md = 6,
  lg = 6,
  xl = 3,
}: APIGridCellProps) => (
  <CustomCol css={cellWrapperStyle} md={md} sm={sm} lg={lg} xl={xl}>
    <A href={link} css={[cellStyle, cellAPIStyle, cellHoverStyle]} className={className} isStyled>
      <div css={cellIconWrapperStyle}>{icon}</div>
      <div css={cellTitleWrapperStyle}>
        {title}
        <ArrowRightIcon className="text-icon-secondary" />
      </div>
    </A>
  </CustomCol>
);

type CommunityGridCellProps = APIGridCellProps & {
  description?: string;
  iconBackground?: string;
};

export const CommunityGridCell = ({
  icon,
  iconBackground = palette.light.gray11,
  title,
  link,
  description,
  className,
  md = 6,
}: CommunityGridCellProps) => (
  <CustomCol css={cellWrapperStyle} md={md}>
    <A
      href={link}
      css={[cellStyle, cellCommunityStyle, cellCommunityHoverStyle]}
      className={className}
      isStyled>
      <div css={[cellCommunityIconWrapperStyle, css({ backgroundColor: iconBackground })]}>
        {icon}
      </div>
      <div css={cellCommunityContentStyle}>
        <span css={cellCommunityTitleStyle}>{title}</span>
        <P css={cellCommunityDescriptionStyle}>{description}</P>
      </div>
      <ArrowUpRightIcon className="text-icon-secondary self-center ml-1.5" />
    </A>
  </CustomCol>
);

const cellWrapperStyle = css`
  padding-left: 0 !important;
  padding-right: 0 !important;

  @media screen and (max-width: ${breakpoints.medium}px) {
    display: none;
  }
`;

const mobileCellWrapperStyle = css({
  width: '100%',

  [`@media screen and (min-width: ${breakpoints.medium}px)`]: {
    display: 'none',
  },
});

const cellHoverStyle = css`
  & {
    transition: box-shadow 200ms;

    svg {
      transition: transform 200ms;
    }
  }

  &:hover {
    box-shadow: ${shadows.sm};

    svg {
      transform: scale(1.05);
    }

    svg[role='img'] {
      transform: none;
    }
  }
`;

const cellStyle = css({
  margin: spacing[4],
  padding: spacing[8],
  minHeight: 200,
  overflow: 'hidden',
  position: 'relative',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: theme.border.default,
  borderRadius: borderRadius.lg,

  h2: {
    marginTop: 0,
    marginBottom: 0,
  },

  h3: {
    marginTop: 0,
  },
});

const cellAPIStyle = css({
  display: 'block',
  backgroundColor: theme.background.subtle,
  padding: 0,
  overflow: 'hidden',
  textDecoration: 'none',
});

const cellIconWrapperStyle = css({
  display: 'flex',
  minHeight: 136,
  justifyContent: 'space-around',
  alignItems: 'center',
});

const cellTitleWrapperStyle = css({
  ...typography.fontSizes[15],
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: theme.background.default,
  padding: spacing[4],
  textDecoration: 'none',
  fontWeight: 500,
  lineHeight: '30px',
  color: theme.text.default,
  alignItems: 'center',
});

const cellCommunityStyle = css({
  display: 'flex',
  minHeight: `calc(100% - (2 * ${spacing[3]}px}))`,
  padding: spacing[4],
  margin: `${spacing[3]}px ${spacing[4]}px`,
  flexDirection: 'row',
  textDecoration: 'none',
});

const cellCommunityIconWrapperStyle = css({
  height: 48,
  width: 48,
  minWidth: 48,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: borderRadius.lg,
  marginRight: spacing[3],
});

const cellCommunityContentStyle = css({
  flexGrow: 1,
});

const cellCommunityTitleStyle = css({
  ...typography.fontSizes[16],
  fontWeight: 500,
  color: theme.text.default,
  textDecoration: 'none',
  marginBottom: spacing[2],
});

const cellCommunityDescriptionStyle = css({
  ...typography.fontSizes[14],
  color: theme.text.secondary,
});

const cellCommunityHoverStyle = css`
  & {
    transition: box-shadow 200ms;

    svg {
      transition: transform 200ms;
    }
  }

  &:hover {
    box-shadow: ${shadows.sm};

    svg {
      transform: scale(1.075);
    }
  }
`;

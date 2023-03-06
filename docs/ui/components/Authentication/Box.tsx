import { css } from '@emotion/react';
import { breakpoints, spacing } from '@expo/styleguide-base';

import { CreateAppButton } from './CreateAppButton';
import { Icon } from './Icon';

import { APIBox } from '~/components/plugins/APIBox';
import { tableWrapperStyle } from '~/ui/components/Table/Table';
import { H3 } from '~/ui/components/Text';

type BoxProps = React.PropsWithChildren<{
  name: string;
  image: string;
  createUrl?: string;
}>;

export const Box = ({ name, image, createUrl, children }: BoxProps) => (
  <APIBox css={boxStyle}>
    <div css={headerStyle}>
      <div css={headerTitleStyle}>
        <Icon title={name} image={image} size={48} />
        <H3>{name}</H3>
      </div>
      {createUrl && <CreateAppButton name={name} href={createUrl} />}
    </div>
    {children}
  </APIBox>
);

const boxStyle = css({
  marginTop: spacing[6],

  [`.css-${tableWrapperStyle.name}`]: {
    marginBottom: spacing[4],
  },
});

const headerStyle = css({
  paddingBottom: spacing[4],
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[4],
  width: '100%',

  [`@media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px)`]: {
    paddingTop: spacing[4],
    gap: spacing[3],
    flexDirection: 'column',
  },
});

const headerTitleStyle = css({
  display: 'flex',
  gap: spacing[3],
  flexDirection: 'row',
  alignItems: 'center',
  width: 'inherit',

  h3: {
    marginBottom: 0,
  },
});

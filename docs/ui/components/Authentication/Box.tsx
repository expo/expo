import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide-base';
import type { PropsWithChildren } from 'react';

import { CreateAppButton } from './CreateAppButton';
import { Icon } from './Icon';

import { APIBox } from '~/components/plugins/APIBox';
import { tableWrapperStyle } from '~/ui/components/Table/Table';
import { H3 } from '~/ui/components/Text';

type BoxProps = PropsWithChildren<{
  name: string;
  image: string;
  createUrl?: string;
}>;

export const Box = ({ name, image, createUrl, children }: BoxProps) => (
  <APIBox className="mt-6" css={boxStyle}>
    <div className="inline-flex flex-row items-center gap-4 pb-4 w-full max-medium:gap-3 max-medium:flex-col">
      <div className="flex flex-row gap-3 items-center w-[inherit]">
        <Icon title={name} image={image} size={48} />
        <H3 style={{ marginBottom: 0 }}>{name}</H3>
      </div>
      {createUrl && <CreateAppButton name={name} href={createUrl} />}
    </div>
    {children}
  </APIBox>
);

const boxStyle = css({
  [`.css-${tableWrapperStyle.name}`]: {
    marginBottom: spacing[4],
  },
});

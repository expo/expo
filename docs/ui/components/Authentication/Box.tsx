import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

import { APIBox } from '~/components/plugins/APIBox';
import { H3 } from '~/ui/components/Text';

import { CreateAppButton } from './CreateAppButton';
import { Icon } from './Icon';

type BoxProps = PropsWithChildren<{
  name: string;
  image: string;
  createUrl?: string;
}>;

export const Box = ({ name, image, createUrl, children }: BoxProps) => (
  <APIBox className={mergeClasses('mt-6 px-4 pt-3', '[&_.table-wrapper]:mb-4')}>
    <div className="max-md-gutters::gap-3 max-md-gutters::flex-col inline-flex w-full flex-row items-center gap-4 pb-4">
      <div className="flex w-[inherit] flex-row items-center gap-3 [&>h3]:!mb-0">
        <Icon title={name} image={image} className="size-12" />
        <H3>{name}</H3>
      </div>
      {createUrl && <CreateAppButton name={name} href={createUrl} />}
    </div>
    {children}
  </APIBox>
);

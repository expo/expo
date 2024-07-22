import type { PropsWithChildren } from 'react';

import { CreateAppButton } from './CreateAppButton';
import { Icon } from './Icon';

import { APIBox } from '~/components/plugins/APIBox';
import { H3 } from '~/ui/components/Text';

type BoxProps = PropsWithChildren<{
  name: string;
  image: string;
  createUrl?: string;
}>;

export const Box = ({ name, image, createUrl, children }: BoxProps) => (
  <APIBox className="mt-6 [&_.table-wrapper]:!mb-4">
    <div className="inline-flex flex-row items-center gap-4 pb-4 w-full max-md-gutters::gap-3 max-md-gutters::flex-col">
      <div className="flex flex-row gap-3 items-center w-[inherit] [&>h3]:!mb-0">
        <Icon title={name} image={image} size={48} />
        <H3>{name}</H3>
      </div>
      {createUrl && <CreateAppButton name={name} href={createUrl} />}
    </div>
    {children}
  </APIBox>
);

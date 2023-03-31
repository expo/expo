import type { PropsWithChildren } from 'react';

import {
  H3Code,
  STYLES_APIBOX,
  STYLES_APIBOX_WRAPPER,
} from '~/components/plugins/api/APISectionUtils';
import { PlatformName } from '~/types/common';
import { PlatformTags } from '~/ui/components/Tag';
import { MONOSPACE } from '~/ui/components/Text';

type APIBoxProps = PropsWithChildren<{
  header?: string;
  platforms?: PlatformName[];
  className?: string;
}>;

export const APIBox = ({ header, platforms, children, className }: APIBoxProps) => {
  return (
    <div css={[STYLES_APIBOX, STYLES_APIBOX_WRAPPER]} className={className}>
      {platforms && <PlatformTags prefix="Only for:" platforms={platforms} />}
      {header && (
        <H3Code tags={platforms}>
          <MONOSPACE weight="medium">{header}</MONOSPACE>
        </H3Code>
      )}
      {children}
    </div>
  );
};

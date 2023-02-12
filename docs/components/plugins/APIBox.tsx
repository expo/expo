import type { PropsWithChildren } from 'react';

import { STYLES_APIBOX, STYLES_APIBOX_WRAPPER } from '~/components/plugins/api/APISectionUtils';
import { PlatformName } from '~/types/common';
import { PlatformTags } from '~/ui/components/Tag';
import { H3 } from '~/ui/components/Text';

type APIBoxProps = PropsWithChildren<{
  header?: string;
  platforms?: PlatformName[];
  className?: string;
}>;

export const APIBox = ({ header, platforms, children, className }: APIBoxProps) => {
  return (
    <div css={[STYLES_APIBOX, STYLES_APIBOX_WRAPPER]} className={className}>
      {platforms && <PlatformTags prefix="Only for:" platforms={platforms} />}
      {header && <H3 tags={platforms}>{header}</H3>}
      {children}
    </div>
  );
};

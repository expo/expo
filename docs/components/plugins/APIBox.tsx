import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import { H3Code } from '~/components/plugins/api/APISectionUtils';
import { STYLES_APIBOX, STYLES_APIBOX_WRAPPER } from '~/components/plugins/api/styles';
import { PlatformName } from '~/types/common';
import { MONOSPACE } from '~/ui/components/Text';

type APIBoxProps = PropsWithChildren<{
  header?: string;
  platforms?: PlatformName[];
  className?: string;
}>;

export const APIBox = ({ header, platforms, children, className }: APIBoxProps) => {
  return (
    <div
      className={mergeClasses(
        STYLES_APIBOX,
        STYLES_APIBOX_WRAPPER,
        className,
        '!pb-4 last:[&>*]:!mb-1'
      )}>
      {platforms && <APISectionPlatformTags prefix="Only for:" userProvidedPlatforms={platforms} />}
      {header && (
        <H3Code tags={platforms}>
          <MONOSPACE weight="medium" className="wrap-anywhere">
            {header}
          </MONOSPACE>
        </H3Code>
      )}
      {children}
    </div>
  );
};

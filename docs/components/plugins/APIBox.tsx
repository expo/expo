import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

import { getCodeHeadingWithBaseNestingLevel } from '~/components/plugins/api/APISectionUtils';
import { APISectionPlatformTags } from '~/components/plugins/api/components/APISectionPlatformTags';
import {
  STYLES_APIBOX,
  STYLES_APIBOX_NESTED,
  STYLES_APIBOX_WRAPPER,
} from '~/components/plugins/api/styles';
import { PlatformName } from '~/types/common';
import { MONOSPACE, RawH3 } from '~/ui/components/Text';

type APIBoxProps = PropsWithChildren<{
  header?: string;
  platforms?: PlatformName[];
  className?: string;
  headerNestingLevel?: number;
}>;

export const APIBox = ({
  header,
  platforms,
  children,
  className,
  headerNestingLevel = 3,
}: APIBoxProps) => {
  const HeadingElement = getCodeHeadingWithBaseNestingLevel(headerNestingLevel, RawH3);
  return (
    <div
      className={mergeClasses(
        STYLES_APIBOX,
        STYLES_APIBOX_WRAPPER,
        headerNestingLevel > 3 && STYLES_APIBOX_NESTED,
        className,
        '!pb-4 last:[&>*]:!mb-1'
      )}>
      {header && (
        <HeadingElement tags={platforms}>
          <MONOSPACE weight="medium" className="wrap-anywhere">
            {header}
          </MONOSPACE>
        </HeadingElement>
      )}
      {platforms && <APISectionPlatformTags prefix="Only for:" userProvidedPlatforms={platforms} />}
      {children}
    </div>
  );
};

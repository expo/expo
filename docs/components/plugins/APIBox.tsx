import { PlatformName } from '../../types/common';

import { H3 } from '~/components/plugins/Headings';
import { PlatformTags } from '~/components/plugins/PlatformTag';
import { STYLES_APIBOX } from '~/components/plugins/api/APISectionUtils';

type APIBoxProps = {
  header?: string;
  platforms?: PlatformName[];
  children: JSX.Element[];
};

export const APIBox = ({ header, platforms, children }: APIBoxProps) => {
  return (
    <div css={STYLES_APIBOX}>
      {platforms && <PlatformTags prefix="Only for:" platforms={platforms} firstElement />}
      {header && <H3>{header}</H3>}
      {children}
    </div>
  );
};

import { H3 } from '~/components/plugins/Headings';
import { STYLES_APIBOX } from '~/components/plugins/api/APISectionUtils';
import { PlatformName } from '~/types/common';
import { PlatformTags } from '~/ui/components/Tag';

type APIBoxProps = React.PropsWithChildren<{
  header?: string;
  platforms?: PlatformName[];
  className?: string;
}>;

export const APIBox = ({ header, platforms, children, className }: APIBoxProps) => {
  return (
    <div css={STYLES_APIBOX} className={className}>
      {platforms && <PlatformTags prefix="Only for:" platforms={platforms} />}
      {header && <H3 tags={platforms}>{header}</H3>}
      {children}
    </div>
  );
};

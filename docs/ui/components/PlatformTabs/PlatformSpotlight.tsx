import { ContentSpotlight } from '~/ui/components/ContentSpotlight';

import { PlatformTabs } from './PlatformTabs';
import { type PlatformImage, orderPlatforms, usePlatformSelection } from './platform';

type Props = {
  android?: PlatformImage;
  ios?: PlatformImage;
};

export function PlatformSpotlight({ android, ios }: Props) {
  const images = { ...(android && { android }), ...(ios && { ios }) };
  const available = orderPlatforms(images);
  const { active, select } = usePlatformSelection(available);
  const image = images[active];

  if (!image) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col items-center">
      <PlatformTabs available={available} active={active} select={select} className="-mb-3" />
      <ContentSpotlight
        variant="component"
        aspect="landscape"
        src={image.src}
        darkSrc={image.darkSrc}
        alt={image.alt}
      />
    </div>
  );
}

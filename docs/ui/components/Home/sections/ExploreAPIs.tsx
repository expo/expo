import { mergeClasses, DocsLogo } from '@expo/styleguide';
import { CameraPlusDuotoneIcon } from '@expo/styleguide-icons/duotone/CameraPlusDuotoneIcon';
import { Image03DuotoneIcon } from '@expo/styleguide-icons/duotone/Image03DuotoneIcon';
import { NotificationMessageDuotoneIcon } from '@expo/styleguide-icons/duotone/NotificationMessageDuotoneIcon';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { type ReactNode } from 'react';

import { HeaderDescription } from '~/ui/components/Home';
import { RawH3, A, LABEL } from '~/ui/components/Text';

export function ExploreAPIs() {
  return (
    <>
      <RawH3>Explore APIs</RawH3>
      <HeaderDescription>
        Expo supplies a vast array of SDK modules. You can also create your own.
      </HeaderDescription>
      <div
        className={mergeClasses(
          'inline-grid w-full grid-cols-4 gap-8 my-4',
          'max-xl-gutters:grid-cols-2',
          'max-lg-gutters:grid-cols-4',
          'max-md-gutters:grid-cols-2',
          'max-sm-gutters:grid-cols-1'
        )}>
        <APIGridCell
          title="Image"
          link="/versions/latest/sdk/image/"
          icon={<Image03DuotoneIcon className="size-16" />}
        />
        <APIGridCell
          title="Camera"
          link="/versions/latest/sdk/camera"
          icon={<CameraPlusDuotoneIcon className="size-16" />}
        />
        <APIGridCell
          title="Notifications"
          link="/versions/latest/sdk/notifications"
          icon={<NotificationMessageDuotoneIcon className="size-16" />}
        />
        <APIGridCell
          title="View all APIs"
          link="/versions/latest/"
          icon={<DocsLogo className="size-16" />}
        />
      </div>
    </>
  );
}

type APIGridCellProps = {
  icon?: ReactNode;
  title?: string;
  link?: string;
  className?: string;
};

function APIGridCell({ icon, title, link, className }: APIGridCellProps) {
  return (
    <A
      href={link}
      className={mergeClasses(
        'min-h-[200px] overflow-hidden relative border border-default rounded-lg block bg-subtle transition group shadow-xs',
        '[&_h2]:!my-0 [&_h3]:!mt-0',
        'hocus:shadow-sm',
        className
      )}
      isStyled>
      <div className="flex min-h-[142px] justify-center items-center transition-transform group-hover:scale-105">
        {icon}
      </div>
      <LABEL className="flex justify-between items-center bg-default min-h-[30px] p-4">
        {title}
        <ArrowRightIcon className="text-icon-secondary" />
      </LABEL>
    </A>
  );
}

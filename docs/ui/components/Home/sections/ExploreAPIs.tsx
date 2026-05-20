import { mergeClasses, DocsLogo } from '@expo/styleguide';
import { CameraPlusDuotoneIcon } from '@expo/styleguide-icons/duotone/CameraPlusDuotoneIcon';
import { Image03DuotoneIcon } from '@expo/styleguide-icons/duotone/Image03DuotoneIcon';
import { NotificationMessageDuotoneIcon } from '@expo/styleguide-icons/duotone/NotificationMessageDuotoneIcon';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { type ReactNode } from 'react';

import { Header } from '~/ui/components/Home/components';
import { A, LABEL } from '~/ui/components/Text';

export function ExploreAPIs() {
  return (
    <>
      <Header
        title="Explore APIs"
        description="Expo supplies a vast array of SDK modules. You can also create your own."
      />
      <div
        className={mergeClasses(
          'my-4 inline-grid w-full grid-cols-4 gap-8',
          'max-xl:grid-cols-2',
          'max-lg:grid-cols-4',
          'max-md:grid-cols-2',
          'max-sm:grid-cols-1'
        )}>
        <APIGridCell
          title="Image"
          link="/versions/latest/sdk/image/"
          icon={<Image03DuotoneIcon className="size-16!" />}
        />
        <APIGridCell
          title="Camera"
          link="/versions/latest/sdk/camera"
          icon={<CameraPlusDuotoneIcon className="size-16!" />}
        />
        <APIGridCell
          title="Notifications"
          link="/versions/latest/sdk/notifications"
          icon={<NotificationMessageDuotoneIcon className="size-16!" />}
        />
        <APIGridCell
          title="View all APIs"
          link="/versions/latest/"
          icon={<DocsLogo className="size-16!" />}
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
        'group relative block min-h-50 overflow-hidden rounded-lg border border-default bg-subtle shadow-xs transition',
        '[&_h2]:my-0! [&_h3]:mt-0!',
        'hocus:shadow-sm',
        className
      )}
      isStyled>
      <div className="flex min-h-35.5 items-center justify-center transition-transform group-hover:scale-105">
        {icon}
      </div>
      <LABEL className="flex min-h-7.5 items-center justify-between bg-default p-4">
        {title}
        <ArrowRightIcon className="text-icon-secondary" />
      </LABEL>
    </A>
  );
}

import { mergeClasses } from '@expo/styleguide';
import { Download03Icon } from '@expo/styleguide-icons/outline/Download03Icon';
import { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  title: string;
  description: string;
  imageUrl: string;
  className?: string;
}>;

export function DownloadSlide({ title, description, imageUrl, className }: Props) {
  return (
    <a
      download
      href={imageUrl}
      className={mergeClasses(
        'relative flex items-stretch overflow-hidden rounded-lg border border-default bg-default shadow-xs transition',
        'hocus:opacity-80 hocus:shadow-sm',
        'max-sm-gutters:flex-col',
        '[&+hr]:!mt-6',
        className
      )}
      aria-label="Download slide">
      <div
        className={mergeClasses(
          'relative flex max-w-[200px] items-center justify-center border-r border-secondary bg-element',
          'max-sm-gutters:max-w-full max-sm-gutters:border-b max-sm-gutters:border-r-0'
        )}>
        <img
          src={imageUrl}
          className="aspect-video"
          alt={title}
          aria-label={`Download slide: ${title}`}
        />
      </div>
      <div className="flex flex-col justify-center gap-1 bg-default px-4 py-2">
        <p className="flex items-center gap-1.5 text-sm font-medium leading-normal">{title}</p>
        {description && (
          <p className="flex items-center gap-2 text-xs text-secondary">{description}</p>
        )}
      </div>
      <Download03Icon
        className="icon-md my-auto ml-auto mr-4 shrink-0 text-icon-secondary max-sm-gutters:hidden"
        aria-hidden="true"
      />
    </a>
  );
}

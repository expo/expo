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
        'border-default bg-default relative flex items-stretch overflow-hidden rounded-lg border shadow-xs transition',
        'hocus:opacity-80 hocus:shadow-sm',
        'max-sm-gutters:flex-col',
        '[&+hr]:mt-6!',
        className
      )}
      aria-label="Download slide">
      <div
        className={mergeClasses(
          'border-secondary bg-element relative flex max-w-[200px] items-center justify-center border-r',
          'max-sm-gutters:max-w-full max-sm-gutters:border-b max-sm-gutters:border-r-0'
        )}>
        <img
          src={imageUrl}
          className="aspect-video"
          alt={title}
          aria-label={`Download slide: ${title}`}
        />
      </div>
      <div className="bg-default flex flex-col justify-center gap-1 px-4 py-2">
        <p className="flex items-center gap-1.5 text-sm leading-normal font-medium">{title}</p>
        {description && (
          <p className="text-secondary flex items-center gap-2 text-sm">{description}</p>
        )}
      </div>
      <Download03Icon
        className="icon-md text-icon-secondary max-sm-gutters:hidden my-auto mr-4 ml-auto shrink-0"
        aria-hidden="true"
      />
    </a>
  );
}

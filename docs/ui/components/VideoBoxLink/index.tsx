import { LinkBase, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { PlaySolidIcon } from '@expo/styleguide-icons/solid/PlaySolidIcon';
import { type ReactNode } from 'react';

import { getVideoUploadDate } from '~/public/static/talks';
import { StructuredData } from '~/ui/components/StructuredData';
import { CALLOUT, LABEL } from '~/ui/components/Text';

type VideoBoxLinkProps = {
  title: string;
  description: ReactNode;
  videoId: string;
  time?: number;
  className?: string;
  uploadDate?: string;
};

export function VideoBoxLink({
  title,
  description,
  videoId,
  time,
  className,
  uploadDate,
}: VideoBoxLinkProps) {
  const resolvedUploadDate = uploadDate ?? getVideoUploadDate(videoId);
  const videoStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    ...(typeof description === 'string' && { description }),
    thumbnailUrl: `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
    ...(resolvedUploadDate && { uploadDate: `${resolvedUploadDate}T00:00:00Z` }),
  };

  return (
    <>
      <StructuredData data={videoStructuredData} id={`video-${videoId}`} />
      <LinkBase
        openInNewTab
        href={`https://www.youtube.com/watch?v=${videoId}${time ? `&t=${time}` : ''}`}
        className={mergeClasses(
          'group border-default bg-default relative flex items-stretch overflow-hidden rounded-lg border shadow-xs transition',
          'hocus:bg-subtle hocus:shadow-sm',
          'max-sm-gutters:flex-col',
          '[&+hr]:mt-6!',
          className
        )}
        aria-label={`Watch video: ${title} (opens in new tab)`}>
        <div
          className={mergeClasses(
            'border-secondary bg-element relative flex max-w-[200px] items-center justify-center overflow-hidden border-r',
            'max-sm-gutters:max-w-full max-sm-gutters:border-b max-sm-gutters:border-r-0'
          )}>
          <img
            src={`https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            className="aspect-video transition duration-300 group-hover:scale-105 group-focus-visible:scale-105"
            alt={title}
            aria-label={`Video thumbnail for ${title}`}
          />
          <div
            className="absolute top-[calc(50%-22px)] right-[calc(50%-22px)] flex size-[44px] items-center justify-center rounded-full bg-[#000a]"
            role="presentation"
            aria-hidden="true">
            <PlaySolidIcon className="icon-lg text-palette-white ml-0.5" />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-1 px-4 py-2">
          <LABEL className="flex items-center gap-1.5 leading-normal">{title}</LABEL>
          {description && (
            <CALLOUT theme="secondary" className="flex items-center gap-2">
              {description}
            </CALLOUT>
          )}
        </div>
        <ArrowUpRightIcon
          className="icon-md text-icon-secondary max-sm-gutters:hidden my-auto mr-4 ml-auto shrink-0"
          aria-hidden="true"
        />
      </LinkBase>
    </>
  );
}

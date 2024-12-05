import { mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { PlaySolidIcon } from '@expo/styleguide-icons/solid/PlaySolidIcon';
import { type ReactNode } from 'react';

import { A, CALLOUT, LABEL } from '~/ui/components/Text';

type VideoBoxLinkProps = {
  title: string;
  description: ReactNode;
  videoId: string;
  className?: string;
};

export function VideoBoxLink({ title, description, videoId, className }: VideoBoxLinkProps) {
  return (
    <A
      openInNewTab
      href={`https://www.youtube.com/watch?v=${videoId}`}
      className={mergeClasses(
        'relative flex items-stretch overflow-hidden rounded-lg border border-default bg-default shadow-xs transition',
        'hocus:shadow-sm',
        'max-sm-gutters:flex-col',
        '[&+hr]:!mt-6',
        className
      )}
      isStyled>
      <div
        className={mergeClasses(
          'relative flex max-w-[200px] items-center justify-center border-r border-secondary bg-element',
          'max-sm-gutters:max-w-full max-sm-gutters:border-b max-sm-gutters:border-r-0'
        )}>
        <img
          src={`https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
          className="aspect-video"
          alt={title}
        />
        <div className="absolute right-[calc(50%-22px)] top-[calc(50%-22px)] flex size-[44px] items-center justify-center rounded-full bg-[#000a]">
          <PlaySolidIcon className="icon-lg ml-0.5 text-palette-white" />
        </div>
      </div>
      <div className="flex flex-col justify-center gap-1 bg-default px-4 py-2">
        <LABEL className="flex items-center gap-1.5 leading-normal">{title}</LABEL>
        {description && (
          <CALLOUT theme="secondary" className="flex items-center gap-2">
            {description}
          </CALLOUT>
        )}
      </div>
      <ArrowUpRightIcon className="icon-md my-auto ml-auto mr-4 shrink-0 text-icon-secondary max-sm-gutters:hidden" />
    </A>
  );
}

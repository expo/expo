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
        'flex overflow-hidden items-stretch relative border border-default rounded-lg bg-default transition shadow-xs',
        'hocus:shadow-sm',
        'max-sm-gutters:flex-col',
        className
      )}
      isStyled>
      <div
        className={mergeClasses(
          'bg-element flex items-center max-w-[200px] justify-center relative border-r border-secondary',
          'max-sm-gutters:max-w-full max-sm-gutters:border-r-0 max-sm-gutters:border-b'
        )}>
        <div
          style={{
            backgroundImage: `url(https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg)`,
          }}
          className={mergeClasses(
            'aspect-video bg-cover bg-center h-[112px]',
            'max-sm-gutters:h-[200px]'
          )}
        />
        <div className="size-[44px] flex items-center justify-center bg-[#000a] rounded-full absolute top-[calc(50%-22px)] right-[calc(50%-22px)]">
          <PlaySolidIcon className="icon-lg text-palette-white ml-0.5" />
        </div>
      </div>
      <div className="px-4 py-2 bg-default flex flex-col gap-1 justify-center">
        <LABEL className="leading-normal flex gap-1.5 items-center">{title}</LABEL>
        {description && (
          <CALLOUT theme="secondary" className="flex gap-2 items-center">
            {description}
          </CALLOUT>
        )}
      </div>
      <ArrowUpRightIcon className="text-icon-secondary shrink-0 icon-md ml-auto my-auto mr-4 max-sm-gutters:hidden" />
    </A>
  );
}

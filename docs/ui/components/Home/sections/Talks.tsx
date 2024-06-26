import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { AtSignIcon } from '@expo/styleguide-icons/outline/AtSignIcon';
import { Users02Icon } from '@expo/styleguide-icons/outline/Users02Icon';
import { type PropsWithChildren } from 'react';

import { TALKS, Talk } from '~/public/static/talks';
import { HeaderDescription } from '~/ui/components/Home';
import { RawH3, CALLOUT, LABEL, A } from '~/ui/components/Text';

export function Talks() {
  return (
    <>
      <div className="flex items-center gap-2">
        <div>
          <RawH3>Watch our latest talks</RawH3>
          <HeaderDescription>
            Explore our team's presentations. Stay informed and gain expertise.
          </HeaderDescription>
        </div>
        <Button
          theme="secondary"
          className="ml-auto"
          rightSlot={<ArrowRightIcon />}
          href="/additional-resources/#talks">
          See more talks
        </Button>
      </div>
      <TalkGridWrapper>
        {TALKS.filter(talk => talk.home).map(talk => (
          <TalkGridCell key={talk.videoId} {...talk} />
        ))}
      </TalkGridWrapper>
    </>
  );
}

export function TalkGridWrapper({ children }: PropsWithChildren) {
  return (
    <div
      className={mergeClasses(
        'inline-grid w-full grid-cols-4 gap-8 my-4',
        'max-2xl-gutters:grid-cols-3',
        'max-xl-gutters:grid-cols-2',
        'max-sm-gutters:grid-cols-1'
      )}>
      {children}
    </div>
  );
}

type TalkGridCellProps = Talk & {
  className?: string;
};

export function TalkGridCell({
  title,
  event,
  description,
  videoId,
  thumbnail,
  link,
  className,
}: TalkGridCellProps) {
  return (
    <A
      openInNewTab
      href={link ?? `https://www.youtube.com/watch?v=${videoId}`}
      className={mergeClasses(
        'flex flex-col h-full min-h-[266px] overflow-hidden relative border border-default rounded-lg bg-default justify-between transition shadow-xs',
        '[&_h2]:!my-0 [&_h3]:!mt-0',
        'hocus:shadow-sm',
        className
      )}
      isStyled>
      <div>
        <div
          style={{
            backgroundImage: `url(${
              thumbnail
                ? `/static/thumbnails/${thumbnail}`
                : `https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`
            })`,
          }}
          className="border-b border-b-default bg-cover bg-center h-[138px] max-sm-gutters:h-[168px]"
        />
        <div className="flex justify-between items-start bg-default min-h-[30px] px-4 py-3 gap-1">
          <LABEL className="block leading-normal">{title}</LABEL>
          <ArrowUpRightIcon className="text-icon-secondary shrink-0 icon-sm mt-1" />
        </div>
      </div>
      <div className="px-4 pb-2 bg-default flex flex-col gap-0.5">
        {description && (
          <CALLOUT theme="secondary" className="flex gap-2 items-center">
            <Users02Icon className="icon-xs text-icon-tertiary shrink-0" />
            {description}
          </CALLOUT>
        )}
        <CALLOUT theme="secondary" className="flex gap-2 items-center">
          <AtSignIcon className="icon-xs text-icon-tertiary shrink-0" />
          {event}
        </CALLOUT>
      </div>
    </A>
  );
}

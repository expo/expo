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
        'my-4 inline-grid w-full grid-cols-4 gap-8',
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
        'relative flex h-full min-h-[266px] flex-col justify-between overflow-hidden rounded-lg border border-default bg-default shadow-xs transition',
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
          className="h-[138px] border-b border-b-default bg-cover bg-center max-sm-gutters:h-[168px]"
        />
        <div className="flex min-h-[30px] items-start justify-between gap-1 bg-default px-4 py-3">
          <LABEL className="block leading-normal">{title}</LABEL>
          <ArrowUpRightIcon className="icon-sm mt-1 shrink-0 text-icon-secondary" />
        </div>
      </div>
      <div className="flex flex-col gap-0.5 bg-default px-4 pb-2">
        {description && (
          <CALLOUT theme="secondary" className="flex items-center gap-2">
            <Users02Icon className="icon-xs shrink-0 text-icon-tertiary" />
            {description}
          </CALLOUT>
        )}
        <CALLOUT theme="secondary" className="flex items-center gap-2">
          <AtSignIcon className="icon-xs shrink-0 text-icon-tertiary" />
          {event}
        </CALLOUT>
      </div>
    </A>
  );
}

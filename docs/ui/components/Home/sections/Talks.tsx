import { mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { AtSignIcon } from '@expo/styleguide-icons/outline/AtSignIcon';
import { Users02Icon } from '@expo/styleguide-icons/outline/Users02Icon';
import { type PropsWithChildren } from 'react';

import { TALKS, Talk } from '~/public/static/talks';
import { CardText, PillButton, SectionHeader } from '~/ui/components/Home/components';
import { CALLOUT, LABEL, A } from '~/ui/components/Text';

const HOME_TALKS_COUNT = 4;

export function Talks() {
  return (
    <>
      <SectionHeader
        title="Watch our latest talks"
        className="items-center"
        action={<PillButton href="/additional-resources/#talks">view all</PillButton>}
      />
      <div className="flex flex-wrap gap-6">
        {TALKS.filter(talk => talk.home)
          .slice(0, HOME_TALKS_COUNT)
          .map(({ title, description, event, videoId, thumbnail, link }) => (
            <A
              key={videoId}
              openInNewTab
              isStyled
              href={link ?? `https://www.youtube.com/watch?v=${videoId}`}
              className="flex w-116.75 items-start gap-4 rounded-lg p-6 outline-(--expo-theme-border-default) outline-[0.5px] outline-offset-[-0.5px] max-md:w-full">
              <img
                src={
                  thumbnail
                    ? `/static/thumbnails/${thumbnail}`
                    : `https://i.ytimg.com/vi_webp/${videoId}/sddefault.webp`
                }
                alt=""
                loading="lazy"
                decoding="async"
                className="h-[67.5px] w-30 shrink-0 rounded-sm object-cover"
              />
              <CardText title={title} className="min-w-0 flex-1">
                {description ? `${description} @ ${event}` : event}
              </CardText>
            </A>
          ))}
      </div>
    </>
  );
}

export function TalkGridWrapper({ children }: PropsWithChildren) {
  return (
    <div
      className={mergeClasses(
        'my-4 inline-grid w-full grid-cols-4 gap-8',
        'max-2xl:grid-cols-3',
        'max-xl:grid-cols-2',
        'max-sm:grid-cols-1'
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
        'relative flex h-full min-h-66.5 flex-col justify-between overflow-hidden rounded-lg border border-default bg-default shadow-xs transition',
        '[&_h2]:my-0! [&_h3]:mt-0!',
        'hocus:shadow-sm',
        className
      )}
      isStyled>
      <div>
        <div className="h-34.5 border-b border-b-default max-sm:h-42">
          <img
            src={
              thumbnail
                ? `/static/thumbnails/${thumbnail}`
                : `https://i.ytimg.com/vi_webp/${videoId}/sddefault.webp`
            }
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover object-center"
          />
        </div>
        <div className="flex min-h-7.5 items-start justify-between gap-1 bg-default px-4 py-3">
          <LABEL className="block leading-normal">{title}</LABEL>
          <ArrowUpRightIcon
            aria-hidden="true"
            className="mt-1 icon-sm shrink-0 text-icon-secondary"
          />
        </div>
      </div>
      <div className="flex flex-col gap-0.5 bg-default px-4 pb-2">
        {description && (
          <CALLOUT theme="secondary" className="flex items-center gap-2">
            <Users02Icon aria-hidden="true" className="icon-xs shrink-0 text-icon-tertiary" />
            {description}
          </CALLOUT>
        )}
        <CALLOUT theme="secondary" className="flex items-center gap-2">
          <AtSignIcon aria-hidden="true" className="icon-xs shrink-0 text-icon-tertiary" />
          {event}
        </CALLOUT>
      </div>
    </A>
  );
}

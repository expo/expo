import { mergeClasses } from '@expo/styleguide';
import { DiscordIcon } from '@expo/styleguide-icons/custom/DiscordIcon';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { RedditIcon } from '@expo/styleguide-icons/custom/RedditIcon';
import { XLogoIcon } from '@expo/styleguide-icons/custom/XLogoIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { type ReactNode } from 'react';

import { HeaderDescription } from '~/ui/components/Home';
import { RawH3, P, A } from '~/ui/components/Text';

export function JoinTheCommunity() {
  return (
    <>
      <RawH3>Join the community</RawH3>
      <HeaderDescription>
        See the source code, connect with others, and get connected.
      </HeaderDescription>
      <div
        className={mergeClasses(
          'inline-grid grid-cols-2 w-full gap-y-6 gap-x-8 my-4',
          'max-xl-gutters:grid-cols-1',
          'max-lg-gutters:grid-cols-2',
          'max-md-gutters:grid-cols-1'
        )}>
        <CommunityGridCell
          title="GitHub"
          description="View our SDK, submit a PR, or report an issue."
          link="https://github.com/expo/expo"
          iconClassName="bg-palette-gray10"
          icon={<GithubIcon className="icon-lg text-palette-white" />}
        />
        <CommunityGridCell
          title="Discord and Forums"
          description="Join our Discord to chat or ask questions."
          link="https://chat.expo.dev"
          icon={<DiscordIcon className="icon-lg text-palette-white" />}
          iconClassName="bg-[#3131E8]"
          shouldLeakReferrer
        />
        <CommunityGridCell
          title="X"
          description="Follow Expo on X for news and updates."
          link="https://x.com/expo"
          icon={<XLogoIcon className="icon-lg text-palette-white" />}
          iconClassName="bg-[#000000]"
        />
        <CommunityGridCell
          title="Reddit"
          description="Get the latest on r/expo."
          link="https://www.reddit.com/r/expo"
          icon={<RedditIcon className="icon-lg text-palette-white" />}
          iconClassName="bg-[#FC471E]"
        />
      </div>
    </>
  );
}

type CommunityGridCellProps = {
  icon?: ReactNode;
  title?: string;
  link?: string;
  className?: string;
  description?: string;
  iconClassName?: string;
  shouldLeakReferrer?: boolean;
};

function CommunityGridCell({
  icon,
  title,
  link,
  description,
  className,
  iconClassName,
  shouldLeakReferrer,
}: CommunityGridCellProps) {
  return (
    <A
      href={link}
      className={mergeClasses(
        'flex justify-between items-center bg-default p-4 min-h-[30px] overflow-hidden relative border border-default rounded-lg transition shadow-xs',
        '[&_h2]:!my-0 [&_h3]:!mt-0',
        'hocus:shadow-sm',
        className
      )}
      shouldLeakReferrer={shouldLeakReferrer}
      isStyled>
      <div
        className={mergeClasses(
          'size-12 inline-flex justify-center items-center rounded-lg mr-4',
          iconClassName
        )}>
        {icon}
      </div>
      <div className="grow">
        <P weight="medium">{title}</P>
        <P theme="secondary" className="!text-xs">
          {description}
        </P>
      </div>
      <ArrowUpRightIcon className="text-icon-secondary self-center ml-1.5" />
    </A>
  );
}

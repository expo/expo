import { mergeClasses } from '@expo/styleguide';
import { BlueskyIcon } from '@expo/styleguide-icons/custom/BlueskyIcon';
import { DiscordIcon } from '@expo/styleguide-icons/custom/DiscordIcon';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { LinkedinIcon } from '@expo/styleguide-icons/custom/LinkedinIcon';
import { RedditIcon } from '@expo/styleguide-icons/custom/RedditIcon';
import { XLogoIcon } from '@expo/styleguide-icons/custom/XLogoIcon';
import { YoutubeIcon } from '@expo/styleguide-icons/custom/YoutubeIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { Lightbulb02Icon } from '@expo/styleguide-icons/outline/Lightbulb02Icon';
import { type ReactNode } from 'react';

import { HeaderDescription } from '~/ui/components/Home';
import { RawH3, P, A, CALLOUT } from '~/ui/components/Text';

export function JoinTheCommunity() {
  return (
    <>
      <RawH3>Join the community</RawH3>
      <HeaderDescription>
        See the source code, connect with others, and get connected.
      </HeaderDescription>
      <div
        className={mergeClasses(
          'inline-grid grid-cols-2 w-full gap-y-1.5 gap-x-8 my-4',
          'border border-default rounded-lg p-3 shadow-xs',
          'max-xl-gutters:grid-cols-1',
          'max-lg-gutters:grid-cols-2',
          'max-md-gutters:grid-cols-1'
        )}>
        <CommunityGridCell
          title="Discord and Forums"
          description="Join our Discord to chat or ask questions."
          link="https://chat.expo.dev"
          icon={<DiscordIcon className="icon-xl text-palette-white" />}
          iconClassName="bg-[#3131E8]"
          shouldLeakReferrer
        />
        <CommunityGridCell
          title="GitHub"
          description="View SDK and docs code, submit a PR, or report an issue."
          link="https://github.com/expo/expo"
          iconClassName="bg-palette-gray11 dark:bg-palette-gray7"
          icon={<GithubIcon className="icon-xl text-palette-white" />}
        />
        <CommunityGridCell
          title="YouTube"
          description="Follow our channel to explore tutorials and other content."
          link="https://www.youtube.com/channel/UCx_YiR733cfqVPRsQ1n8Fag"
          iconClassName="bg-[#FF0033]"
          icon={<YoutubeIcon className="icon-xl text-palette-white" />}
        />
        <CommunityGridCell
          title="LinkedIn"
          description="Follow Expo on LinkedIn for news and updates."
          link="https://www.linkedin.com/company/expo-dev/"
          iconClassName="bg-[#0B66C2]"
          icon={<LinkedinIcon className="icon-xl text-palette-white" />}
        />
        <CommunityGridCell
          title="Bluesky"
          description="Follow Expo on Bluesky for news and updates."
          link="https://bsky.app/profile/expo.dev"
          icon={<BlueskyIcon className="icon-xl text-palette-white" />}
          iconClassName="bg-[#1083fe]"
        />
        <CommunityGridCell
          title="X"
          description="Follow Expo on X for news and updates."
          link="https://x.com/expo"
          icon={<XLogoIcon className="size-7 text-palette-white" />}
          iconClassName="bg-[#000000]"
        />
        <CommunityGridCell
          title="Reddit"
          description="Get the latest on r/expo."
          link="https://www.reddit.com/r/expo"
          icon={<RedditIcon className="icon-xl text-palette-white" />}
          iconClassName="bg-[#FC471E]"
        />
        <CommunityGridCell
          title="Canny"
          description="Give us a feedback or request a feature."
          link="https://expo.canny.io/"
          icon={<Lightbulb02Icon className="icon-xl text-palette-white" />}
          iconClassName="bg-[#525df9]"
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
        'flex justify-between items-center bg-default p-2 pr-3 min-h-[30px] overflow-hidden relative rounded-lg transition gap-3',
        'hocus:bg-element hocus:opacity-100',
        className
      )}
      shouldLeakReferrer={shouldLeakReferrer}
      isStyled>
      <div
        className={mergeClasses(
          'size-12 shrink-0 inline-flex justify-center items-center rounded-lg',
          iconClassName
        )}>
        {icon}
      </div>
      <div className="flex flex-col grow gap-0.5">
        <P weight="medium" className="leading-snug">
          {title}
        </P>
        <CALLOUT theme="secondary" className="leading-snug">
          {description}
        </CALLOUT>
      </div>
      <ArrowUpRightIcon className="text-icon-tertiary self-center shrink-0" />
    </A>
  );
}

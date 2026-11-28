import { BlueskyIcon } from '@expo/styleguide-icons/custom/BlueskyIcon';
import { DiscordIcon } from '@expo/styleguide-icons/custom/DiscordIcon';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { LinkedinIcon } from '@expo/styleguide-icons/custom/LinkedinIcon';
import { RedditIcon } from '@expo/styleguide-icons/custom/RedditIcon';
import { XLogoIcon } from '@expo/styleguide-icons/custom/XLogoIcon';
import { Lightbulb02Icon } from '@expo/styleguide-icons/outline/Lightbulb02Icon';
import { YoutubeIcon } from '@expo/styleguide-icons/outline/YoutubeIcon';
import { type ComponentType, type HTMLAttributes } from 'react';

import { A } from '~/ui/components/Text';

type CommunityLink = {
  title: string;
  href: string;
  Icon: ComponentType<HTMLAttributes<SVGSVGElement>>;
  shouldLeakReferrer?: boolean;
};

const COMMUNITY_LINKS: CommunityLink[] = [
  {
    title: 'Discord and forums',
    href: 'https://chat.expo.dev',
    Icon: DiscordIcon,
    shouldLeakReferrer: true,
  },
  {
    title: 'YouTube',
    href: 'https://www.youtube.com/channel/UCx_YiR733cfqVPRsQ1n8Fag',
    Icon: YoutubeIcon,
  },
  { title: 'LinkedIn', href: 'https://www.linkedin.com/company/expo-dev/', Icon: LinkedinIcon },
  { title: 'X', href: 'https://x.com/expo', Icon: XLogoIcon },
  { title: 'Reddit', href: 'https://www.reddit.com/r/expo', Icon: RedditIcon },
  { title: 'Bluesky', href: 'https://bsky.app/profile/expo.dev', Icon: BlueskyIcon },
  { title: 'GitHub', href: 'https://github.com/expo/expo', Icon: GithubIcon },
  { title: 'Canny', href: 'https://expo.canny.io/', Icon: Lightbulb02Icon },
];

export function JoinTheCommunity() {
  return (
    <div className="flex flex-col items-center gap-4 py-24">
      <p className="text-center text-base leading-[1.4] font-medium text-secondary">
        Join the community
      </p>
      <div className="flex flex-wrap justify-center gap-3 rounded-[48px] bg-default p-2">
        {COMMUNITY_LINKS.map(({ title, href, Icon, shouldLeakReferrer }) => (
          <A
            key={title}
            href={href}
            isStyled
            aria-label={title}
            title={title}
            shouldLeakReferrer={shouldLeakReferrer}
            className="flex items-center rounded-3xl p-2 hocus:bg-element">
            <Icon aria-hidden="true" className="icon-lg text-icon-default" />
          </A>
        ))}
      </div>
    </div>
  );
}

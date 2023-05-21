import { css } from '@emotion/react';
import { theme, DocsLogo } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import {
  ArrowLeftIcon,
  BookOpen02Icon,
  Home02Icon,
  GraduationHat02Icon,
  Stars02Icon,
} from '@expo/styleguide-icons';

import { shouldShowFeaturePreviewLink } from '~/constants/FeatureFlags.cjs';
import { Search } from '~/ui/components/Search';
import { SidebarSingleEntry } from '~/ui/components/Sidebar/SidebarSingleEntry';
import { A } from '~/ui/components/Text';

type SidebarHeadProps = {
  sidebarActiveGroup: string;
};

export const SidebarHead = ({ sidebarActiveGroup }: SidebarHeadProps) => {
  if (sidebarActiveGroup === 'archive') {
    return (
      <div css={sidebarHeadContainerStyle}>
        <A isStyled href="/" css={sidebarBackLinkStyle}>
          <ArrowLeftIcon className="text-icon-secondary" />
          Back
        </A>
      </div>
    );
  }

  return (
    <div css={sidebarHeadContainerStyle}>
      <Search />
      <SidebarSingleEntry
        href="/"
        title="Home"
        Icon={Home02Icon}
        isActive={sidebarActiveGroup === 'home'}
      />
      <SidebarSingleEntry
        href="/workflow/customizing"
        title="Guides"
        Icon={BookOpen02Icon}
        isActive={sidebarActiveGroup === 'general'}
      />
      <SidebarSingleEntry
        href="/versions/latest"
        title="Reference"
        Icon={DocsLogo}
        isActive={sidebarActiveGroup === 'reference'}
      />
      <SidebarSingleEntry
        href="/tutorial/introduction/"
        title="Learn"
        Icon={GraduationHat02Icon}
        isActive={sidebarActiveGroup === 'learn'}
      />
      {shouldShowFeaturePreviewLink() && (
        <SidebarSingleEntry
          href="/feature-preview"
          title="Feature Preview"
          Icon={Stars02Icon}
          isActive={sidebarActiveGroup === 'featurePreview' || sidebarActiveGroup === 'preview'}
        />
      )}
    </div>
  );
};

const sidebarHeadContainerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[4],
  borderBottom: `1px solid ${theme.border.default}`,
  background: theme.background.default,
  gap: spacing[0.5],
});

const sidebarBackLinkStyle = css({
  color: theme.text.secondary,
  display: 'flex',
  gap: spacing[3],
  alignItems: 'center',
});

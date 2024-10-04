import { css } from '@emotion/react';
import { spacing, theme, PlanEnterpriseIcon, ArrowLeftIcon, DocsLogo } from '@expo/styleguide';

import { GuidesIcon } from './icons/Guides';
import { PreviewIcon, PreviewInactiveIcon } from './icons/Preview';

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
          <ArrowLeftIcon color={theme.icon.secondary} />
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
        title="Guides"
        Icon={GuidesIcon}
        isActive={sidebarActiveGroup === 'general'}
      />
      <SidebarSingleEntry
        href="/eas"
        title="Expo Application Services"
        Icon={PlanEnterpriseIcon}
        isActive={sidebarActiveGroup === 'eas'}
      />
      <SidebarSingleEntry
        href="/versions/latest"
        title="API Reference"
        Icon={DocsLogo}
        isActive={sidebarActiveGroup === 'reference'}
      />
      {shouldShowFeaturePreviewLink() && (
        <SidebarSingleEntry
          href="/feature-preview"
          title="Feature Preview"
          Icon={
            sidebarActiveGroup === 'featurePreview' || sidebarActiveGroup === 'preview'
              ? PreviewIcon
              : PreviewInactiveIcon
          }
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

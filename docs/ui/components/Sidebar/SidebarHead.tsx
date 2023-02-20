import { css } from '@emotion/react';
import { spacing, theme, PlanEnterpriseIcon, iconSize } from '@expo/styleguide';

import { APIIcon, APIInactiveIcon } from './icons/API';
import { GuidesIcon } from './icons/Guides';
import { PreviewIcon, PreviewInactiveIcon } from './icons/Preview';

import { shouldShowFeaturePreviewLink } from '~/constants/FeatureFlags.cjs';
import { Search } from '~/ui/components/Search';
import { SidebarSingleEntry } from '~/ui/components/Sidebar/SidebarSingleEntry';
import { customIconContainerStyle } from '~/ui/components/Sidebar/icons/styles';

type SidebarHeadProps = {
  sidebarActiveGroup: string;
};

export const SidebarHead = ({ sidebarActiveGroup }: SidebarHeadProps) => {
  return (
    <div css={sidebarHeadContainer}>
      <Search />
      <SidebarSingleEntry
        href="/"
        title="Guides"
        Icon={() => (
          <div css={customIconContainerStyle}>
            <GuidesIcon
              color={sidebarActiveGroup === 'general' ? theme.text.link : theme.icon.default}
              size={iconSize.sm}
            />
          </div>
        )}
        isActive={sidebarActiveGroup === 'general'}
      />
      <SidebarSingleEntry
        href="/eas"
        title="Expo Application Services"
        Icon={() => (
          <div css={customIconContainerStyle}>
            <PlanEnterpriseIcon
              color={sidebarActiveGroup === 'eas' ? theme.text.link : theme.icon.default}
              size={iconSize.sm}
            />
          </div>
        )}
        isActive={sidebarActiveGroup === 'eas'}
      />
      <SidebarSingleEntry
        href="/versions/latest"
        title="API Reference"
        Icon={sidebarActiveGroup === 'reference' ? APIIcon : APIInactiveIcon}
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

const sidebarHeadContainer = css({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[4],
  borderBottom: `1px solid ${theme.border.default}`,
  background: theme.background.default,
});

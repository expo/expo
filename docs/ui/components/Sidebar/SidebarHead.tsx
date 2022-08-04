import { css } from '@emotion/react';
import { spacing, theme } from '@expo/styleguide';
import * as React from 'react';

import { APIIcon, APIInactiveIcon } from './icons/API';
import { DocumentationIcon, DocumentationInactiveIcon } from './icons/Documentation';
import { EASIcon, EASInactiveIcon } from './icons/EAS';
import { PreviewIcon, PreviewInactiveIcon } from './icons/Preview';

import { shouldShowFeaturePreviewLink } from '~/constants/FeatureFlags';
import { SidebarHeadEntry } from '~/ui/components/Sidebar/SidebarHeadEntry';

type SidebarHeadProps = {
  sidebarActiveGroup: string;
};

export const SidebarHead = ({ sidebarActiveGroup }: SidebarHeadProps) => {
  return (
    <div css={sidebarHeadContainer}>
      <SidebarHeadEntry
        href="/"
        title="Guides"
        Icon={sidebarActiveGroup === 'general' ? DocumentationIcon : DocumentationInactiveIcon}
        isActive={sidebarActiveGroup === 'general'}
      />
      <SidebarHeadEntry
        href="/eas"
        title="Expo Application Services"
        Icon={sidebarActiveGroup === 'eas' ? EASIcon : EASInactiveIcon}
        isActive={sidebarActiveGroup === 'eas'}
      />
      <SidebarHeadEntry
        href="/versions/latest"
        title="API Reference"
        Icon={sidebarActiveGroup === 'reference' ? APIIcon : APIInactiveIcon}
        isActive={sidebarActiveGroup === 'reference'}
      />
      {shouldShowFeaturePreviewLink() && (
        <SidebarHeadEntry
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
  background: theme.background.secondary,
});

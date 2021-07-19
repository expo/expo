import { css } from '@emotion/react';
import { HomeFilledIcon, QuestionMarkIcon, theme, spacing } from '@expo/styleguide';
import React from 'react';

import { Group } from './Group';
import { GroupLink } from './GroupLink';
import { RootLink } from './RootLink';

import { Spacer } from '~/ui/components/Spacer';
import { MenuColumn } from '~/ui/containers/Document';
import { SDKIcon } from '~/ui/foundations/icons';

type MenuProps = object;

// TODO(cedric): features
// - [ ] Persist open/close groups with context (not window)
// - [ ] Force-open groups where a child route is active
// - [ ] Generate the menu based on navigation data
// - [ ] Detect active section from current url
// - [ ] Replace the RootLinks with version selector when on API pages

// TODO(cedric): design
// - [ ] Set right scrolling areas, top area should be sticky with lower area fading
// - [ ] Add the subheaders in the collapsibles/Group

export const Menu = (props: MenuProps) => (
  <MenuColumn css={{ padding: '1rem' }}>
    <div css={rootSectionStyle}>
      <RootLink href="/" icon={HomeFilledIcon} isActive>
        Home
      </RootLink>
      <RootLink href="/versions/latest" icon={SDKIcon}>
        API reference
      </RootLink>
      <RootLink href="/versions/latest" icon={QuestionMarkIcon}>
        Feature preview
      </RootLink>
    </div>
    <Group title="Get started">
      <GroupLink isActive>Installation</GroupLink>
      <GroupLink>Create a new app</GroupLink>
      <GroupLink>Errors and debugging</GroupLink>
    </Group>
    <Spacer orientation="vertical" size={16} />
    <Group title="Tutorial">
      <GroupLink>First steps</GroupLink>
      <GroupLink>Styling text</GroupLink>
      <GroupLink>Adding an image</GroupLink>
      <GroupLink>Creating a button</GroupLink>
      <GroupLink>Picking an image</GroupLink>
      <GroupLink>Sharing an image</GroupLink>
      <GroupLink>Handling platform differences</GroupLink>
      <GroupLink>Configuring an app icon and splash screen</GroupLink>
      <GroupLink>Learning more</GroupLink>
    </Group>
    <Spacer orientation="vertical" size={16} />
    <Group title="Conceptual overview" isOpen={false}>
      <GroupLink>Workflows</GroupLink>
      <GroupLink>Walkthroughs</GroupLink>
      <GroupLink>Limitations</GroupLink>
      <GroupLink>Common questions</GroupLink>
    </Group>
  </MenuColumn>
);

const rootSectionStyle = css`
  padding-bottom: ${spacing[4]}px;
  margin-bottom: ${spacing[4]}px;
  border-bottom: 1px solid ${theme.border.default};
`;

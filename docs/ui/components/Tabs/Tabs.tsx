import { css } from '@emotion/react';
import { shadows, theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { TabList, TabPanels, Tabs as ReachTabs, TabsProps } from '@reach/tabs';
import * as React from 'react';

import { TabButton } from './TabButton';

type Props = React.PropsWithChildren<TabsProps> & {
  tabs: string[];
};

const generateTabLabels = (children: React.ReactNode) => {
  return React.Children.map(children, child =>
    React.isValidElement(child) ? child?.props?.label : child || '[untitled]'
  );
};

export const Tabs = ({ children, tabs }: Props) => {
  const tabTitles = tabs || generateTabLabels(children);
  const [tabIndex, setTabIndex] = React.useState(0);

  return (
    <ReachTabs index={tabIndex} onChange={setTabIndex} css={tabsWrapperStyle}>
      <TabList css={tabsListStyle}>
        {tabTitles.map((title, index) => (
          <TabButton key={index} selected={index === tabIndex}>
            {title}
          </TabButton>
        ))}
      </TabList>
      <TabPanels css={tabsPanelStyle}>{children}</TabPanels>
    </ReachTabs>
  );
};

const tabsWrapperStyle = css({
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.sm,
  boxShadow: shadows.xs,
  margin: `${spacing[4]}px 0`,
});

const tabsPanelStyle = css({
  padding: `${spacing[4]}px ${spacing[5]}px ${spacing[1]}px`,

  'pre:first-child': {
    marginTop: spacing[1],
  },

  ul: {
    marginBottom: spacing[3],
  },
});

const tabsListStyle = css({
  borderBottom: `1px solid ${theme.border.default}`,
});

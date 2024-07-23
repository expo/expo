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

const SharedTabsContext = React.createContext<{
  index: number;
  setIndex: (index: number) => void;
} | null>(null);

/**
 * Wraps a group of tabs to share the same state. Useful for guides where one aspect of the guide is broken up into multiple tabs, e.g. Yarn vs NPM.
 */
export function TabsGroup({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = React.useState(0);
  return (
    <SharedTabsContext.Provider value={{ index, setIndex }}>{children}</SharedTabsContext.Provider>
  );
}

export const Tabs = (props: Props) => {
  const context = React.useContext(SharedTabsContext);
  const [tabIndex, setTabIndex] = React.useState(0);

  if (context) {
    return <InnerTabs {...props} {...context} />;
  }

  return <InnerTabs {...props} index={tabIndex} setIndex={setTabIndex} />;
};

const InnerTabs = ({
  children,
  tabs,
  index: tabIndex,
  setIndex,
}: Props & { index: number; setIndex: (index: number) => void }) => {
  const tabTitles = tabs || generateTabLabels(children);

  return (
    <ReachTabs index={tabIndex} onChange={setIndex} css={tabsWrapperStyle}>
      <TabList css={tabsListStyle}>
        {tabTitles.map((title, index) => (
          <TabButton key={index} selected={index === tabIndex}>
            {title}
          </TabButton>
        ))}
      </TabList>
      <TabPanels css={tabsPanelStyle} className="last:[&>div>*]:!mb-0">
        {children}
      </TabPanels>
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
  padding: `${spacing[4]}px ${spacing[5]}px`,

  'pre:first-of-type': {
    marginTop: spacing[1],
  },

  ul: {
    marginBottom: spacing[3],
  },
});

const tabsListStyle = css({
  borderBottom: `1px solid ${theme.border.default}`,
});

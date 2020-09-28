import { css } from '@emotion/core';
import { Tab as ReachTab, TabList, TabPanel, TabPanels, Tabs as ReachTabs } from '@reach/tabs';
import * as React from 'react';

import * as Constants from '~/constants/theme';

const STYLES_TAB_BUTTON = css`
  transition: all 0.15s ease 0s;

  padding: 1rem;
  font-size: 1rem;
  font-weight: bold;
  border-width: 0px;
  border-bottom-width: 3px;
  background-color: transparent;

  :hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const STYLES_TAB_PANELS = css`
  padding-top: 6;
`;

function TabButton({ selected, ...props }) {
  return (
    <ReachTab
      {...props}
      css={STYLES_TAB_BUTTON}
      style={{
        borderColor: selected ? Constants.colors.expo : 'transparent',
        color: selected ? Constants.colors.expo : Constants.colors.darkGrey,
      }}
    />
  );
}

export function Tabs({ children, tabs }) {
  children = Array.isArray(children) ? children : [children];
  const tabTitles = children.map(
    (child, index) => child.props.label || tabs[index] || '[untitled]'
  );
  const [tabIndex, setTabIndex] = React.useState(0);

  return (
    <ReachTabs index={tabIndex} onChange={setTabIndex}>
      <TabList>
        {tabTitles.map((title, index) => (
          <TabButton key={index} selected={index === tabIndex}>
            {title}
          </TabButton>
        ))}
      </TabList>
      <TabPanels className={STYLES_TAB_PANELS}>{children}</TabPanels>
    </ReachTabs>
  );
}

export function Tab(props) {
  return <TabPanel {...props} />;
}

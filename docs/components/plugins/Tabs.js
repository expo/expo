import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { Tab as ReachTab, TabList, TabPanel, TabPanels, Tabs as ReachTabs } from '@reach/tabs';
import * as React from 'react';

const STYLES_TAB_BUTTON = css`
  transition: all 0.05s ease 0s;

  padding: 1rem;
  font-size: 1rem;
  font-weight: bold;
  border-width: 0px;
  border-bottom-width: 3px;
  background-color: transparent;

  :hover {
    background-color: ${theme.background.tertiary};
    cursor: pointer;
  }
`;

function TabButton({ selected, ...props }) {
  return (
    <ReachTab
      {...props}
      css={STYLES_TAB_BUTTON}
      style={{
        borderColor: selected ? theme.link.default : 'transparent',
        color: selected ? theme.link.default : theme.text.secondary,
      }}
    />
  );
}

export function Tabs({ children, tabs, panelStyle }) {
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
      <TabPanels style={panelStyle || { paddingTop: 6 }}>{children}</TabPanels>
    </ReachTabs>
  );
}

export function Tab(props) {
  return <TabPanel {...props} />;
}

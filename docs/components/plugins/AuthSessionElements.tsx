import { css } from '@emotion/core';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@reach/tabs';
import { string } from 'prop-types';
import * as React from 'react';

import * as Constants from '~/constants/theme';

const STYLES_LINK = css`
  text-decoration: none;
  transition: box-shadow 0.15s ease 0s, transform 0.15s ease 0s, -webkit-box-shadow 0.15s ease 0s,
    -webkit-transform 0.15s ease 0s;
  box-shadow: rgba(2, 8, 20, 0.1) 0px 0.175em 0.5em, rgba(2, 8, 20, 0.08) 0px 0.085em 0.175em;

  .protocol {
    opacity: 0;
    transform: translateY(4px);
  }

  :hover {
    box-shadow: rgba(2, 8, 20, 0.1) 0px 0.35em 1.175em, rgba(2, 8, 20, 0.08) 0px 0.175em 0.5em;
    transform: scale(1.05);

    .protocol {
      opacity: 0.6;
      transform: translateY(0px);
    }
  }
`;

const STYLES_BUTTON = css`
  display: inline-flex;
`;

export const CreateAppButton: React.FC<{ href: string; name: string }> = ({ href, name }) => (
  <a css={STYLES_BUTTON} className="snack-inline-example-button" href={href}>
    Create {name} App
  </a>
);

export const SocialGrid: React.FC = ({ children }) => (
  <div
    style={{
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gridTemplateRows: '1fr',
      display: 'grid',
      gap: '1.35rem',
    }}>
    {children}
  </div>
);

export const SocialGridItem: React.FC<{
  title: string;
  image?: string;
  href?: string;
  protocol: string[];
}> = ({ title, protocol = [], image, href }) => (
  <a
    href={href}
    css={STYLES_LINK}
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1.65em 2em',
      gap: '1.35rem',
      textDecoration: 'none',
    }}>
    <img
      style={{
        width: 56,
        height: 56,
        marginBottom: '1.2em',
      }}
      src={image}
    />
    <p
      style={{
        color: '#020814',
        fontSize: '1.2em',
        fontWeight: 900,
        textAlign: 'center',
      }}>
      {title}
    </p>
    {(protocol || []).length && (
      <p
        className="protocol"
        style={{
          transitionProperty: 'all',
          transitionDuration: '0.15s',

          marginTop: '0.4em',
          color: '#020814',
          fontSize: '0.9em',
          fontWeight: 400,
          textAlign: 'center',
        }}>
        {protocol.join(' | ')}
      </p>
    )}
  </a>
);

export const AuthMethodTab = TabPanel;

const TAB_BUTTON = css`
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

// TODO (barthap): Will not update it, because it is replaced in my Tabs PR
// @ts-ignore
function AuthMethodTabButton({ selected, ...props }) {
  return (
    <Tab
      {...props}
      css={TAB_BUTTON}
      style={{
        borderColor: selected ? Constants.colors.expo : 'transparent',
        color: selected ? Constants.colors.expo : Constants.colors.darkGrey,
      }}
    />
  );
}

// TODO(Bacon): The tab class should define the tab name
export function AuthCodeTab(props: any) {
  return <TabPanel {...props} />;
}

export function ImplicitTab(props: any) {
  return <TabPanel {...props} />;
}

// @ts-ignore
export function AuthMethodTabSwitcher({ children, tabs }) {
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  return (
    <Tabs index={tabIndex} onChange={handleTabsChange}>
      <TabList>
        {tabs.map((title: string, index: number) => {
          return (
            <AuthMethodTabButton key={index} selected={tabIndex === index}>
              {title}
            </AuthMethodTabButton>
          );
        })}
      </TabList>
      <TabPanels style={{ paddingTop: 8 }}>{children}</TabPanels>
    </Tabs>
  );
}

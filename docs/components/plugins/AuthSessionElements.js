import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@reach/tabs';
import * as React from 'react';
import { css } from 'react-emotion';
import * as Constants from '~/common/constants';

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

export function CreateAppButton({ href, name }) {
  return (
    <a className="snack-inline-example-button" href={href}>
      Create {name} App
    </a>
  );
}

export function SocialGrid({ children }) {
  return (
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
}

export function SocialGridItem({ title, protocol = [], image, href }) {
  return (
    <a
      href={href}
      className={STYLES_LINK}
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
          fontWeight: '900',
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
            fontWeight: '400',
            textAlign: 'center',
          }}>
          {protocol.join(' | ')}
        </p>
      )}
    </a>
  );
}

export const AuthMethodTab = TabPanel;

const TAB_BUTTON = css`
  transition: all 0.15s ease 0s;

  :hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

function AuthMethodTabButton({ selected, ...props }) {
  return (
    <Tab
      {...props}
      className={TAB_BUTTON}
      style={{
        padding: '1rem',
        fontSize: '1rem',
        fontWeight: 'bold',
        borderColor: selected ? Constants.colors.expo : 'transparent',
        borderWidth: 0,
        borderBottomWidth: 3,
        color: selected ? Constants.colors.expo : Constants.colors.darkGrey,
      }}
    />
  );
}

export function AuthCodeTab(props) {
  return <TabPanel {...props} />;
}
export function ImplicitTab(props) {
  return <TabPanel {...props} />;
}

function getTabName(tab) {
  if (tab === 'AuthCodeTab') {
    return 'Auth Code';
  } else if (tab === 'ImplicitTab') {
    return 'Implicit Flow';
  }
  return 'other';
}

export function AuthMethodTabSwitcher({ children }) {
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleTabsChange = index => {
    setTabIndex(index);
  };

  return (
    <Tabs index={tabIndex} onChange={handleTabsChange}>
      <TabList>
        {React.Children.toArray(children).map((item, index) => {
          const title = getTabName(item.type.name);
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

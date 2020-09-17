import { css } from 'emotion';
import React from 'react';

import * as Constants from '~/common/constants';

const STYLES_TAB_CONTAINER = css``;
const STYLES_TAB_CONTENT = css`
  padding: 10px 20px;
`;

const STYLES_TAB_LIST = css`
  border-bottom: 1px solid #ccc;
  padding-left: 0;
`;

const STYLES_TAB_LIST_ITEM = css`
  display: inline-block;
  list-style: none;
  margin-bottom: -1px;
  padding: 10px 15px;
  font-family: ${Constants.fontFamilies.demi};

  :hover {
    cursor: pointer;
  }
`;

const STYLES_TAB_LIST_ACTIVE = css`
  background-color: white;
  border: solid #ccc;
  border-bottom: 0px;
  border-width: 1px 1px 0 1px;
  background: ${Constants.expoColors.gray[200]};
  border-radius: 4px;
`;

const TabButton = ({ activeTab, label, onClick }) => {
  const handleClick = () => onClick(label);

  const classNames = [STYLES_TAB_LIST_ITEM];
  if (activeTab === label) {
    classNames.push(STYLES_TAB_LIST_ACTIVE);
  }

  return (
    <li className={classNames.join(' ')} onClick={handleClick}>
      {label}
    </li>
  );
};

/**
 * Dummy emelent, needed for `<Tabs/>` component to work properly
 */
export const Tab = ({ children }) => children;

/**
 * @example
 * <Tabs>
 *   <Tab label="Tab1">Tab 1 content...</Tab>
 *   <Tab label="Tab2">Tab 2 content...</Tab>
 * </Tabs>
 */

export const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = React.useState(children[0].props.label);

  return (
    <div className={STYLES_TAB_CONTAINER}>
      <ol className={STYLES_TAB_LIST}>
        {children.map(child => {
          const { label } = child.props;
          return (
            <TabButton activeTab={activeTab} key={label} label={label} onClick={setActiveTab} />
          );
        })}
      </ol>
      <div className={STYLES_TAB_CONTENT}>
        {children.map(child => {
          if (child.props.label !== activeTab) return;
          return child.props.children;
        })}
      </div>
    </div>
  );
};

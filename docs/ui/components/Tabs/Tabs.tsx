import { mergeClasses } from '@expo/styleguide';
import { TabList, TabPanels, Tabs as ReachTabs, TabsProps } from '@reach/tabs';
import {
  Children,
  PropsWithChildren,
  isValidElement,
  useState,
  useContext,
  ReactNode,
  useMemo,
} from 'react';

import { TabButton } from './TabButton';
import { SharedTabsContext } from './TabsGroup';

type Props = PropsWithChildren<TabsProps> & {
  tabs: string[];
};

const generateTabLabels = (children: ReactNode) => {
  return Children.map(children, child =>
    isValidElement(child) ? child?.props?.label : child || '[untitled]'
  );
};

export const Tabs = (props: Props) => {
  const context = useContext(SharedTabsContext);
  const [tabIndex, setTabIndex] = useState(0);

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
  const tabTitles = tabs ?? generateTabLabels(children);

  const layoutId = useMemo(
    () => tabTitles.reduce((acc, tab) => acc + tab, `${Math.random().toString(36).substring(5)}-`),
    []
  );

  return (
    <ReachTabs
      index={tabIndex}
      onChange={setIndex}
      className="border border-default rounded-md shadow-xs my-4">
      <TabList className="flex px-4 py-3 gap-1 flex-wrap border-b border-secondary">
        {tabTitles.map((title, index) => (
          <TabButton key={index} active={index === tabIndex} label={title} layoutId={layoutId} />
        ))}
      </TabList>
      <TabPanels
        className={mergeClasses(
          'py-4 px-5',
          '[&_ul]:mb-3 [&_pre]:first-of-type:mt-1',
          'last:[&>div>*]:!mb-0'
        )}>
        {children}
      </TabPanels>
    </ReachTabs>
  );
};

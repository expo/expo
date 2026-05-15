import { mergeClasses } from '@expo/styleguide';
import { TabList, TabPanels, Tabs as ReachTabs, TabsProps } from '@reach/tabs';
import {
  Children,
  Fragment,
  PropsWithChildren,
  ReactElement,
  isValidElement,
  useState,
  useContext,
  ReactNode,
  useMemo,
} from 'react';

import { InsideTabsContext } from './InsideTabsContext';
import { Tab } from './Tab';
import { TabButton } from './TabButton';
import { SharedTabsContext } from './TabsGroup';

type Props = PropsWithChildren<TabsProps> & {
  tabs?: string[];
};

type TabChild = ReactElement<{ label?: string }>;

const collectTabPanels = (nodes: ReactNode): TabChild[] => {
  const panels: TabChild[] = [];

  Children.forEach(nodes, child => {
    if (!isValidElement<{ children?: ReactNode }>(child)) {
      return;
    }

    if (child.type === Fragment) {
      panels.push(...collectTabPanels(child.props.children));
      return;
    }

    if (child.type === Tab) {
      panels.push(child as TabChild);
    }
  });

  return panels;
};

const generateTabLabels = (tabPanels: TabChild[]) =>
  tabPanels.map(child => child.props.label ?? '[untitled]');

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
  const tabPanels = useMemo(() => collectTabPanels(children), [children]);
  const tabTitles = tabs?.length === tabPanels.length ? tabs : generateTabLabels(tabPanels);

  const layoutId = useMemo(
    () => tabTitles.reduce((acc, tab) => acc + tab, `${Math.random().toString(36).slice(5)}-`),
    []
  );

  return (
    <ReachTabs
      index={tabIndex}
      onChange={setIndex}
      className="border-default my-4 rounded-md border shadow-xs">
      <TabList className="border-secondary flex flex-wrap gap-1 border-b px-4 py-3">
        {tabTitles.map((title, index) => (
          <TabButton key={index} active={index === tabIndex} label={title} layoutId={layoutId} />
        ))}
      </TabList>
      <InsideTabsContext.Provider value>
        <TabPanels
          className={mergeClasses(
            'px-5 py-4',
            '[&_ul]:mb-3',
            '[&_figure:first-child]:mt-1 [&_pre:first-child]:mt-1',
            '[&>div>*:last-child]:mb-0!'
          )}>
          {tabPanels}
        </TabPanels>
      </InsideTabsContext.Provider>
    </ReachTabs>
  );
};

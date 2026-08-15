import { mergeClasses } from '@expo/styleguide';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {
  Children,
  Fragment,
  PropsWithChildren,
  ReactElement,
  cloneElement,
  isValidElement,
  useState,
  useContext,
  ReactNode,
  useId,
  useMemo,
} from 'react';

import { InsideTabsContext } from './InsideTabsContext';
import { Tab, TabPanelProps } from './Tab';
import { TabButton } from './TabButton';
import { SharedTabsContext } from './TabsGroup';

type Props = PropsWithChildren<{
  tabs?: string[];
}>;

type TabChild = ReactElement<TabPanelProps>;

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

  const layoutId = useId();

  return (
    <TabsPrimitive.Root
      data-md="tabs"
      value={String(tabIndex)}
      onValueChange={value => {
        setIndex(Number(value));
      }}
      className="my-4 rounded-md border border-default shadow-xs">
      <TabsPrimitive.List className="flex flex-wrap gap-1 border-b border-secondary px-4 py-3">
        {tabTitles.map((title, index) => (
          <TabButton
            key={index}
            value={String(index)}
            active={index === tabIndex}
            label={title}
            layoutId={layoutId}
          />
        ))}
      </TabsPrimitive.List>
      <InsideTabsContext.Provider value>
        <div
          className={mergeClasses(
            'px-5 py-4',
            '[&_ul]:mb-3',
            '[&_figure:first-child]:mt-1 [&_pre:first-child]:mt-1',
            '[&>div>*:last-child]:mb-0!'
          )}>
          {tabPanels.map((panel, index) =>
            cloneElement(panel, { key: index, value: String(index), hidden: index !== tabIndex })
          )}
        </div>
      </InsideTabsContext.Provider>
    </TabsPrimitive.Root>
  );
};

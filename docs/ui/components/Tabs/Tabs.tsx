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
    isValidElement<{ label: string }>(child) ? child?.props?.label : (child ?? '[untitled]')
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
    () => tabTitles.reduce((acc, tab) => acc + tab, `${Math.random().toString(36).slice(5)}-`),
    []
  );

  return (
    <ReachTabs
      index={tabIndex}
      onChange={setIndex}
      className="my-4 rounded-md border border-default shadow-xs">
      <TabList className="flex flex-wrap gap-1 border-b border-secondary px-4 py-3">
        {tabTitles.map((title, index) => (
          <TabButton key={index} active={index === tabIndex} label={title} layoutId={layoutId} />
        ))}
      </TabList>
      <TabPanels
        className={mergeClasses(
          'px-5 py-4',
          '[&_ul]:mb-3',
          'first:[&_figure]:mt-1 first:[&_pre]:mt-1',
          'last:[&>div>*]:!mb-0'
        )}>
        {children}
      </TabPanels>
    </ReachTabs>
  );
};

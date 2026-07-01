import * as TabsPrimitive from '@radix-ui/react-tabs';
import { ReactNode } from 'react';

export type TabPanelProps = {
  label?: string;
  value?: string;
  hidden?: boolean;
  children?: ReactNode;
};

export const Tab = ({ label: _label, value = '', hidden, children }: TabPanelProps) => (
  <TabsPrimitive.Content value={value} forceMount hidden={hidden}>
    {children}
  </TabsPrimitive.Content>
);

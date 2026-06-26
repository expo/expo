import { TabPanel, TabPanelProps } from '@reach/tabs';

export const Tab = ({ label: _label, ...props }: TabPanelProps & { label?: string }) => (
  <TabPanel {...props} />
);

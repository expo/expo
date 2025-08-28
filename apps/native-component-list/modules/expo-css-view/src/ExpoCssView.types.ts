import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {};

export type ExpoCssViewModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type ExpoCssViewProps = {
  style?: StyleProp<ViewStyle & { backdropFilter?: ViewStyle['filter'] }>;
  children?: React.ReactNode;
};

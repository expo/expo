<% const hasEvent = project.features.includes('Event'); -%>
<% const hasView = project.features.includes('View') || project.features.includes('ViewEvent'); -%>
<% if (hasView) { -%>
import type { StyleProp, ViewStyle } from 'react-native';

<% } -%>
<% if (!hasEvent && !hasView) { -%>
// No feature types selected.
export {};
<% } -%>
<% if (hasEvent) { -%>
export type <%- project.moduleName %>Events = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};
<% } -%>
<% if (hasView) { -%>
<% if (hasEvent) { -%>

<% } -%>
export type OnLoadEventPayload = {
  url: string;
};

export type <%- project.viewName %>Props = {
  url: string;
<% if (project.features.includes('ViewEvent')) { -%>
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
<% } -%>
  style?: StyleProp<ViewStyle>;
};
<% } -%>

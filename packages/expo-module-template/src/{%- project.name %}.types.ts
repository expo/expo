<% const hasEvent = project.features.includes('Event'); -%>
<% const hasView = project.features.includes('View') || project.features.includes('ViewEvent'); -%>
<% if (hasView) { -%>
import type { StyleProp, ViewStyle } from 'react-native';

<% } -%>
<% if (!hasEvent && !hasView) { -%>
// Define your exported module types here.
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
export type OnTapEventPayload = Record<string, never>;

export type <%- project.viewName %>Props = {
<% if (project.features.includes('ViewEvent')) { -%>
  onTap: (event: { nativeEvent: OnTapEventPayload }) => void;
<% } -%>
  style?: StyleProp<ViewStyle>;
};
<% } -%>

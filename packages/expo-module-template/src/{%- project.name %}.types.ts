<% const hasEvent = project.features.includes('Event'); -%>
<% const hasView = project.features.includes('View') || project.features.includes('ViewEvent'); -%>
<% const hasSharedObjectViewProp = hasView && project.features.includes('SharedObject'); -%>
<% if (hasView) { -%>
import type { StyleProp, ViewStyle } from 'react-native';

<% } -%>
<% if (hasSharedObjectViewProp) { -%>
import type { <%- project.sharedObjectName %> } from './<%- project.sharedObjectName %>';

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
<% if (hasSharedObjectViewProp) { -%>
  sharedObject?: <%- project.sharedObjectName %> | null;
<% } -%>
  style?: StyleProp<ViewStyle>;
};
<% if (hasSharedObjectViewProp) { -%>

export type Native<%- project.viewName %>Props = Omit<<%- project.viewName %>Props, 'sharedObject'> & {
  sharedObject?: number | null;
};
<% } -%>
<% } -%>

export type ChangeEventPayload = {
  value: string;
};

export type OnLoadEventPayload = {
  url: string;
};

export type <%- project.moduleName %>Events = {
  onChange: (params: ChangeEventPayload) => void;
};

export type <%- project.viewName %>Props = {
  url: string;
  onLoad: (payload: OnLoadEventPayload) => void;
};

type WidgetRegistryEntry = {
  layout: string;
  initialProps?: Record<string, unknown>;
};

const widgets: Record<string, WidgetRegistryEntry> = {};
const noopWidget = {
  reload() {},
  updateTimeline() {},
  updateSnapshot() {},
  getTimeline() {
    return Promise.resolve([]);
  },
};
const noopLiveActivityFactory = {
  start() {
    return {};
  },
  getInstances() {
    return [];
  },
};

export function createWidget(name: string, layout: string, initialProps?: Record<string, unknown>) {
  widgets[name] = { layout };
  if (initialProps != null) {
    widgets[name].initialProps = initialProps;
  }
  return noopWidget;
}

export function createLiveActivity() {
  return noopLiveActivityFactory;
}

export function addUserInteractionListener() {
  return { remove() {} };
}

export function addPushToStartTokenListener() {
  return { remove() {} };
}

export function after(date: Date) {
  return { after: date };
}

export function __expoWidgetsGetLayoutRegistry() {
  return {
    widgets: { ...widgets },
  };
}

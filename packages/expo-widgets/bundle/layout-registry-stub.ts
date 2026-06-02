const widgetLayouts: Record<string, string> = {};
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

export function createWidget(name: string, layout: string) {
  widgetLayouts[name] = layout;
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
  return { ...widgetLayouts };
}

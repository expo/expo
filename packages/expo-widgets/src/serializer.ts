import { ExpoLiveActivityEntry, ExpoTimelineEntry, WidgetFamily } from './Widgets.types';

const getName = (value: string | Function) => {
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'function') {
    return value.name;
  }
  return value;
};
const replacer = (key: string, value: any) => {
  switch (key) {
    case 'type':
      return getName(value);
    case '_owner':
    case '_store':
    case 'ref':
    case 'key':
      return;
    default:
      return value;
  }
};

export const serialize = (
  entry: Record<WidgetFamily, ExpoTimelineEntry[]> | ExpoLiveActivityEntry
) => {
  const json = JSON.stringify(entry, replacer);
  return json;
};

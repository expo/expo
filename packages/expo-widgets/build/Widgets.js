import ExpoWidgetModule from './ExpoWidgets';
import { supportedFamilies } from './constants';
import { serialize } from './serializer';
export const startLiveActivity = (name, liveActivity, url) => {
    const text = serialize(liveActivity());
    return ExpoWidgetModule.startLiveActivity(name, text, url);
};
export const updateLiveActivity = (id, name, liveActivity) => {
    const text = serialize(liveActivity());
    ExpoWidgetModule.updateLiveActivity(id, name, text);
};
export const updateWidgetTimeline = (name, dates, widget, props) => {
    const fakeProps = Object.keys(props || {}).reduce((acc, key) => {
        acc[key] = `{{${key}}}`;
        return acc;
    }, {});
    const data = supportedFamilies
        .map((family) => ({
        family,
        entries: dates.map((date) => ({
            timestamp: date.getTime(),
            content: widget({ date, family, ...fakeProps }),
        })),
    }))
        .reduce((acc, { family, entries }) => {
        acc[family] = entries;
        return acc;
    }, {});
    ExpoWidgetModule.updateWidget(name, serialize(data), props);
    ExpoWidgetModule.reloadWidget();
};
export const updateWidgetSnapshot = (name, widget, props) => {
    updateWidgetTimeline(name, [new Date()], widget, props || {});
};
export const addEventListener = ExpoWidgetModule.addListener;
//# sourceMappingURL=Widgets.js.map
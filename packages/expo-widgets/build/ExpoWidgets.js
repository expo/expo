const noopSubscription = { remove() { } };
class WidgetStub {
    constructor(_name, _layout) { }
    reload() { }
    updateTimeline(_entries) { }
    async getTimeline() {
        return [];
    }
}
class LiveActivityStub {
    async update(_props) { }
    async end(_dismissalPolicy, _afterDate, _state, _contentDate) { }
    async getPushToken() {
        return null;
    }
    addListener(_eventName, _listener) {
        return noopSubscription;
    }
}
class LiveActivityFactoryStub {
    constructor(_name, _layout) { }
    start(_props, _url) {
        return new LiveActivityStub();
    }
    getInstances() {
        return [];
    }
}
const ExpoWidgetsModule = {
    reloadAllWidgets() { },
    Widget: WidgetStub,
    LiveActivityFactory: LiveActivityFactoryStub,
    LiveActivity: LiveActivityStub,
    addListener(_eventName, _listener) {
        return noopSubscription;
    },
};
export default ExpoWidgetsModule;
//# sourceMappingURL=ExpoWidgets.js.map
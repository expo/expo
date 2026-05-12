import { NativeModule, registerWebModule } from 'expo';
export * from './types';
class ExpoAppMetricsModule extends NativeModule {
    addCustomMetricToSession(metric) {
        throw new Error('Method not implemented.');
    }
    async markFirstRender() { }
    async markInteractive(attributes) { }
    logEvent(name, options) { }
    async getStoredEntries() {
        return [];
    }
    async clearStoredEntries() { }
    async getAllSessions() {
        return [];
    }
    simulateCrashReport() { }
    triggerCrash() { }
    async getMainSession() {
        return null;
    }
}
export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
//# sourceMappingURL=module.web.js.map
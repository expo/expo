import { NativeModule, registerWebModule } from 'expo';
export * from './types';
class ExpoAppMetricsModule extends NativeModule {
    addCustomMetricToSession(sessionId, metric) {
        throw new Error('Method not implemented.');
    }
    async markFirstRender() { }
    async markInteractive(_attributes) { }
    async getStoredEntries() {
        return [];
    }
    async clearStoredEntries() { }
    async getAllSessions() {
        return [];
    }
    simulateCrashReport() { }
    triggerCrash() { }
    startSession(metadata) {
        return '';
    }
    stopSession(sessionId) { }
}
export default registerWebModule(ExpoAppMetricsModule, 'ExpoAppMetrics');
//# sourceMappingURL=module.web.js.map
import PlatformModule from './PlatformModule';
class ExponentPedometer extends PlatformModule {
    get name() {
        return 'ExponentPedometer';
    }
    //   async getStepCountAsync(startTime: number, endTime: number) {}
    async isAvailableAsync() {
        return false;
    }
}
export default new ExponentPedometer();
//# sourceMappingURL=ExponentPedometer.web.js.map
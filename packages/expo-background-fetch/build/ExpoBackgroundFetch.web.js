import { BackgroundFetchStatus } from './BackgroundFetch.types';
export default {
    get name() {
        return 'ExpoBackgroundFetch';
    },
    async getStatusAsync() {
        return BackgroundFetchStatus.Restricted;
    },
};
//# sourceMappingURL=ExpoBackgroundFetch.web.js.map
import { CellularGeneration } from './Cellular.types';
export default {
    get allowsVoip() {
        return null;
    },
    get carrier() {
        return null;
    },
    get isoCountryCode() {
        return null;
    },
    get mobileCountryCode() {
        return null;
    },
    get mobileNetworkCode() {
        return null;
    },
    async getCellularGenerationAsync() {
        let connection = navigator['connection'] || navigator['mozConnection'] || navigator['webkitConnection'];
        switch (connection.effectiveType) {
            case 'slow-2g':
            case '2g':
                return Promise.resolve(CellularGeneration['2G']);
            case '3g':
                return Promise.resolve(CellularGeneration['3G']);
            case '4g':
                return Promise.resolve(CellularGeneration['4G']);
            default:
                return Promise.resolve(CellularGeneration.UNKNOWN);
        }
    },
};
//# sourceMappingURL=ExpoCellular.web.js.map
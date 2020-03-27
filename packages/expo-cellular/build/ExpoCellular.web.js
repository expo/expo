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
        const connection = navigator['connection'] ||
            navigator['mozConnection'] ||
            navigator['webkitConnection'] ||
            null;
        if (connection !== null) {
            switch (connection.effectiveType) {
                case 'slow-2g':
                case '2g':
                    return CellularGeneration.CELLULAR_2G;
                case '3g':
                    return CellularGeneration.CELLULAR_3G;
                case '4g':
                    return CellularGeneration.CELLULAR_4G;
                default:
                    return CellularGeneration.UNKNOWN;
            }
        }
        else {
            return CellularGeneration.UNKNOWN;
        }
    },
};
//# sourceMappingURL=ExpoCellular.web.js.map
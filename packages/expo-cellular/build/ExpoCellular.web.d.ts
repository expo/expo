import { CellularGeneration, CellularInfo } from './Cellular.types';
declare const _default: {
    readonly allowsVoip: null;
    readonly carrier: null;
    readonly isoCountryCode: null;
    readonly mobileCountryCode: null;
    readonly mobileNetworkCode: null;
    getCellularGenerationAsync(): Promise<CellularGeneration>;
    getCurrentCarrierAsync(): Promise<CellularInfo>;
};
export default _default;

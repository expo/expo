import { CellularGeneration } from './Cellular.types';
declare const _default: {
    readonly allowsVoip: null;
    readonly carrier: null;
    readonly isoCountryCode: null;
    readonly mobileCountryCode: null;
    readonly mobileNetworkCode: null;
    getCellularGenerationAsync(): Promise<CellularGeneration>;
    allowsVoipAsync(): Promise<boolean | null>;
    getIsoCountryCodeAsync(): Promise<string | null>;
    getCarrierNameAsync(): Promise<string | null>;
    getMobileCountryCodeAsync(): Promise<string | null>;
    getMobileNetworkCodeAsync(): Promise<string | null>;
};
export default _default;
//# sourceMappingURL=ExpoCellular.web.d.ts.map
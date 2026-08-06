import type { AgeRangeRequest, AgeRangeResponse, AgeRangeRegulatoryFeature, AgeSignalsStatus } from './ExpoAgeRange.types';
export declare function requestAgeRangeAsync(_: AgeRangeRequest): Promise<AgeRangeResponse>;
export declare function isEligibleForAgeFeaturesAsync(): Promise<boolean | null>;
export declare function showSignificantUpdateAcknowledgmentAsync(_updateDescription: string): Promise<void>;
export declare function getRequiredRegulatoryFeaturesAsync(): Promise<AgeRangeRegulatoryFeature[] | null>;
export declare function requestAgeSignalsAccessAsync(): Promise<AgeSignalsStatus | null>;
//# sourceMappingURL=AgeRange.web.d.ts.map
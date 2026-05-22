import type { AgeRangeRequest, AgeRangeResponse, RegulatoryFeature } from './ExpoAgeRange.types';
export declare function requestAgeRangeAsync(_: AgeRangeRequest): Promise<AgeRangeResponse>;
export declare function isEligibleForAgeFeaturesAsync(): Promise<boolean | null>;
export declare function showSignificantUpdateAcknowledgementAsync(_updateDescription: string): Promise<void>;
export declare function getRequiredRegulatoryFeaturesAsync(): Promise<RegulatoryFeature[] | null>;
//# sourceMappingURL=AgeRange.web.d.ts.map
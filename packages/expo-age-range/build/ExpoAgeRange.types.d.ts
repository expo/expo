import { NativeModule } from 'expo-modules-core/types';
/**
 * @platform ios
 * */
export type AgeRangeRequest = {
    threshold1: number;
    threshold2?: number;
    threshold3?: number;
};
export type AgeRangeResponse = {
    lowerBound?: number;
    upperBound?: number;
    /**
     * @platform ios
     * */
    ageRangeDeclaration?: 'selfDeclared' | 'guardianDeclared';
    /**
     * @platform ios
     * */
    activeParentalControls: string[];
};
/**
 * @hidden
 */
export interface ExpoAgeRangeModule extends NativeModule {
    requestAgeRangeAsync(options: AgeRangeRequest): Promise<AgeRangeResponse>;
}
//# sourceMappingURL=ExpoAgeRange.types.d.ts.map
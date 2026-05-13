import type { NativeModule } from 'expo-modules-core/types';

/**
 * Options for requesting age range information from the user.
 *
 * @platform ios
 */
export type AgeRangeRequest = {
  /** The required minimum age for your app. */
  threshold1: number;
  /** An optional additional minimum age for your app. */
  threshold2?: number;
  /** An optional additional minimum age for your app. */
  threshold3?: number;
};

/**
 * Response containing the user's age range information.
 *
 * Contains age boundaries and platform-specific metadata.
 */
export type AgeRangeResponse = {
  /** The lower limit of the person’s age range. */
  lowerBound: number | null;
  /** The upper limit of the person’s age range. */
  upperBound: number | null;
  /**
   * Indicates whether the age range was declared by the user themselves or someone else (parent, guardian, or Family Organizer in a Family Sharing group).
   *
   * @platform ios
   */
  ageRangeDeclaration?: 'selfDeclared' | 'guardianDeclared' | null;
  /**
   * List of parental controls enabled and shared as a part of age range declaration.
   *
   * @platform ios
   */
  activeParentalControls?: string[];
  /**
   * An ID assigned to supervised user installs by Google Play, used to notify you of revoked app approval.
   *
   * @platform android
   */
  installId?: string | null;
  /**
   * The user's age verification or supervision status.
   *
   * @platform android
   */
  userStatus?:
    | 'VERIFIED'
    | 'SUPERVISED'
    | 'SUPERVISED_APPROVAL_PENDING'
    | 'SUPERVISED_APPROVAL_DENIED'
    | 'DECLARED'
    | 'UNKNOWN'
    | null;
  /**
   * The effective date (timestamp) of the most recent significant change that was approved.
   *
   * @platform android
   */
  mostRecentApprovalDate?: number | null;
};

export interface ExpoAgeRangeModule extends NativeModule {
  requestAgeRangeAsync(options: AgeRangeRequest): Promise<AgeRangeResponse>;
  /**
   * Returns whether the current Apple Account is in scope of an age-assurance
   * regulation that Apple recognizes (e.g. Utah, Louisiana, and select non-US
   * regions). Use this to short-circuit age gating outside of those jurisdictions
   * without implementing custom geo-tracking.
   *
   * Rejects when the request fails. See {@link https://developer.apple.com/documentation/declaredagerange/agerangeservice/error AgeRangeService.Error doc}
   * for more information.
   *
   * Resolves with `null` on iOS versions earlier than 26.2 and on platforms
   * other than iOS — callers should treat `null` as "unknown / not supported"
   * rather than as a definitive `false`.
   *
   * @platform ios 26.2+
   */
  isEligibleForAgeFeaturesAsync(): Promise<boolean | null>;
}

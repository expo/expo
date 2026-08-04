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
   * Indicates how the age range was declared:
   * - `'selfDeclared'` — declared by the user themselves.
   * - `'guardianDeclared'` — declared by someone else (parent, guardian, or Family Organizer in a Family Sharing group).
   * - `'confirmed'` — confirmed by the system (for example, verified against a government ID or payment method). Only reported on iOS 26.5+.
   *
   * See `ageRangeSource` for the Android equivalent.
   *
   * @platform ios
   */
  ageRangeDeclaration?: 'selfDeclared' | 'guardianDeclared' | 'confirmed' | null;
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
   * The methodology Play Age Signals used to determine the user's age range:
   * - `'TIER_A'` — unsupervised, self declared.
   * - `'TIER_B'` — supervised user, meaning the guardian attests to the user's age range.
   * - `'TIER_C'` — unsupervised, estimated.
   * - `'TIER_D'` — unsupervised, verified, for example through an ID check.
   *
   * `null` when Play Age Signals reports no source.
   *
   * @platform android
   */
  ageRangeSource?: 'TIER_A' | 'TIER_B' | 'TIER_C' | 'TIER_D' | null;
  /**
   * Whether a guardian has approved the significant changes recorded for your app:
   * - `'APPROVED'` — the most recent significant change, and all earlier ones, are approved.
   * - `'PENDING'` — one or more significant changes are waiting for approval.
   * - `'DECLINED'` — approval was denied for one or more significant changes.
   *
   * `null` for unsupervised accounts, and for supervised accounts with no significant changes yet.
   *
   * @platform android
   */
  significantChangeStatus?: 'APPROVED' | 'PENDING' | 'DECLINED' | null;
  /**
   * The effective date (timestamp) of the most recent significant change that was approved.
   *
   * `null` when no significant change has been approved.
   *
   * @platform android
   */
  significantChangeApprovalDate?: number | null;
  /**
   * The user's age verification or supervision status.
   *
   * Play Age Signals removed this signal and replaced it with `ageRangeSource`.
   *
   * @deprecated Use `ageRangeSource` and `significantChangeStatus` instead. This field
   * will be removed in a future release.
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
   * @deprecated Use `significantChangeApprovalDate` instead — it reports the same value. This field
   * will be removed in a future release.
   *
   * @platform android
   */
  mostRecentApprovalDate?: number | null;
};

/**
 * The sharing status of age signals, returned by [`requestAgeSignalsAccessAsync`](#agerangerequestagesignalsaccessasync).
 *
 * @platform android
 */
export type AgeSignalsStatus = 'SHARED' | 'NOT_SHARED' | 'VERIFICATION_REQUIRED';

/**
 * A regulatory feature that your app may need to support for the current user.
 *
 * Mirrors [`AgeRangeService.RegulatoryFeature`](https://developer.apple.com/documentation/declaredagerange/agerangeservice/regulatoryfeature).
 *
 * @platform ios 26.4+
 */
export type AgeRangeRegulatoryFeature =
  | 'declaredAgeRangeRequired'
  | 'significantAppChangeRequiresAdultNotification'
  | 'significantAppChangeRequiresParentalConsent';

export interface ExpoAgeRangeModule extends NativeModule {
  requestAgeRangeAsync(options: AgeRangeRequest): Promise<AgeRangeResponse>;
  isEligibleForAgeFeaturesAsync(): Promise<boolean | null>;
  showSignificantUpdateAcknowledgmentAsync(updateDescription: string): Promise<void>;
  getRequiredRegulatoryFeaturesAsync(): Promise<AgeRangeRegulatoryFeature[] | null>;
  requestAgeSignalsAccessAsync(): Promise<AgeSignalsStatus | null>;
}

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
   * - `'confirmed'` — confirmed by the system (for example, verified against a government ID or payment method). Only reported on iOS 26.2+.
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
   * - `'TIER_A'` — the user self-declared their age.
   * - `'TIER_B'` — a parent or guardian manages the user's age.
   * - `'TIER_C'` — the age was assessed using a credit card, email address, selfie assessment, government ID, or tax ID.
   * - `'TIER_D'` — the age was checked using a combination of government ID and selfie assessment, or a digital ID.
   *
   * `null` when the sharing status reported by [`requestAgeSignalsAccessAsync`](#agerangerequestagesignalsaccessasync)
   * is `'NOT_SHARED'` or `'VERIFICATION_REQUIRED'`.
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
   * The effective date (timestamp) of the most recently approved significant change.
   *
   * `null` when no changes have been recorded for your app.
   *
   * @platform android
   */
  significantChangeApprovalDate?: number | null;
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
 * The age signals that [`setFakeAgeSignalsAsync`](#agerangesetfakeagesignalsasyncfake) reports in
 * place of the ones Play would report. Every field is optional, and an omitted field is reported as
 * `null`, the same way Play reports a signal it has no value for.
 *
 * @platform android
 */
export type FakeAgeSignals = {
  /** Reported as `lowerBound` by [`requestAgeRangeAsync`](#agerangerequestagerangeasyncoptions). */
  lowerBound?: number | null;
  /** Reported as `upperBound` by [`requestAgeRangeAsync`](#agerangerequestagerangeasyncoptions). */
  upperBound?: number | null;
  /** Reported as `installId` by [`requestAgeRangeAsync`](#agerangerequestagerangeasyncoptions). */
  installId?: string | null;
  /** Reported as `ageRangeSource` by [`requestAgeRangeAsync`](#agerangerequestagerangeasyncoptions). */
  ageRangeSource?: 'TIER_A' | 'TIER_B' | 'TIER_C' | 'TIER_D' | null;
  /** Reported as `significantChangeStatus` by [`requestAgeRangeAsync`](#agerangerequestagerangeasyncoptions). */
  significantChangeStatus?: 'APPROVED' | 'PENDING' | 'DECLINED' | null;
  /** Reported as `significantChangeApprovalDate` by [`requestAgeRangeAsync`](#agerangerequestagerangeasyncoptions). */
  significantChangeApprovalDate?: number | null;
  /** Reported by [`requestAgeSignalsAccessAsync`](#agerangerequestagesignalsaccessasync). */
  ageSignalsStatus?: AgeSignalsStatus | null;
  /**
   * When set, both `requestAgeRangeAsync` and `requestAgeSignalsAccessAsync` reject with this Play
   * Age Signals error code instead of reporting a result. See the
   * [error code reference](https://developer.android.com/google/play/age-signals/handle-errors)
   * for the available codes.
   */
  errorCode?: number | null;
};

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
  isFakeAgeSignalsEnabledAsync(): Promise<boolean>;
  setFakeAgeSignalsAsync(fake: FakeAgeSignals | null): Promise<void>;
}

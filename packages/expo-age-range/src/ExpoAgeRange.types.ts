import { NativeModule } from 'expo-modules-core/types';

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
  lowerBound?: number;
  /** The upper limit of the person’s age range. */
  upperBound?: number;
  /**
   * Indicates whether the age range was declared by the user themselves or someone else (parent, guardian, or Family Organizer in a Family Sharing group).
   *
   * @platform ios
   */
  ageRangeDeclaration?: 'selfDeclared' | 'guardianDeclared';
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
  installId?: string;
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
    | 'UNKNOWN';
};

export interface ExpoAgeRangeModule extends NativeModule {
  requestAgeRangeAsync(options: AgeRangeRequest): Promise<AgeRangeResponse>;
}

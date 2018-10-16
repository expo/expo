/*
 * Copyright 2017 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** Error codes in Firebase error domain. */
typedef NS_ENUM(NSInteger, FIRErrorCode) {
  /**
   * Unknown error.
   */
  FIRErrorCodeUnknown = 0,
  /**
   * Loading data from the GoogleService-Info.plist file failed. This is a fatal error and should
   * not be ignored. Further calls to the API will fail and/or possibly cause crashes.
   */
  FIRErrorCodeInvalidPlistFile = -100,

  /**
   * Validating the Google App ID format failed.
   */
  FIRErrorCodeInvalidAppID = -101,

  /**
   * Error code for failing to configure a specific service.
   */
  FIRErrorCodeAdMobFailed = -110,
  FIRErrorCodeAppInviteFailed = -112,
  FIRErrorCodeCloudMessagingFailed = -113,
  FIRErrorCodeConfigFailed = -114,
  FIRErrorCodeDatabaseFailed = -115,
  FIRErrorCodeCrashReportingFailed = -118,
  FIRErrorCodeDurableDeepLinkFailed = -119,
  FIRErrorCodeAuthFailed = -120,
  FIRErrorCodeInstanceIDFailed = -121,
  FIRErrorCodeStorageFailed = -123,

  /**
   * Error codes returned by Dynamic Links
   */
  FIRErrorCodeDynamicLinksStrongMatchNotAvailable = -124,
  FIRErrorCodeDynamicLinksManualRetrievalNotEnabled = -125,
  FIRErrorCodeDynamicLinksPendingLinkOnlyAvailableAtFirstLaunch = -126,
  FIRErrorCodeDynamicLinksPendingLinkRetrievalAlreadyRunning = -127,
};

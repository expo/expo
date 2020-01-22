/*
 * Copyright 2018 Google
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

#import <Foundation/Foundation.h>

/** A list of message codes to print in the logger that help to correspond printed messages with
 * code locations.
 *
 * Prefixes:
 * - MCW => MessageCodeWarning
 * - MCE => MessageCodeError
 */
typedef NS_ENUM(NSInteger, GDTCORMessageCode) {

  /** For warning messages concerning transportBytes: not being implemented by a data object. */
  GDTCORMCWDataObjectMissingBytesImpl = 1,

  /** For warning messages concerning a failed event upload. */
  GDTCORMCWUploadFailed = 2,

  /** For warning messages concerning a forced event upload. */
  GDTCORMCWForcedUpload = 3,

  /** For warning messages concerning a failed reachability call. */
  GDTCORMCWReachabilityFailed = 4,

  /** For error messages concerning transform: not being implemented by an event transformer. */
  GDTCORMCETransformerDoesntImplementTransform = 1000,

  /** For error messages concerning the creation of a directory failing. */
  GDTCORMCEDirectoryCreationError = 1001,

  /** For error messages concerning the writing of a event file. */
  GDTCORMCEFileWriteError = 1002,

  /** For error messages concerning the lack of a prioritizer for a given backend. */
  GDTCORMCEPrioritizerError = 1003,

  /** For error messages concerning a package delivery API violation. */
  GDTCORMCEDeliverTwice = 1004,

  /** For error messages concerning an error in an implementation of -transportBytes. */
  GDTCORMCETransportBytesError = 1005,

  /** For general purpose error messages in a dependency. */
  GDTCORMCEGeneralError = 1006,

  /** For fatal errors. Please go to https://github.com/firebase/firebase-ios-sdk/issues and open
   * an issue if you encounter an error with this code.
   */
  GDTCORMCEFatalAssertion = 1007
};

/** */
FOUNDATION_EXPORT
void GDTCORLog(GDTCORMessageCode code, NSString *_Nonnull format, ...);

/** Returns the string that represents some message code.
 *
 * @param code The code to convert to a string.
 * @return The string representing the message code.
 */
FOUNDATION_EXPORT NSString *_Nonnull GDTCORMessageCodeEnumToString(GDTCORMessageCode code);

// A define to wrap GULLogWarning with slightly more convenient usage.
#define GDTCORLogWarning(MESSAGE_CODE, MESSAGE_FORMAT, ...) \
  GDTCORLog(MESSAGE_CODE, MESSAGE_FORMAT, __VA_ARGS__);

// A define to wrap GULLogError with slightly more convenient usage and a failing assert.
#define GDTCORLogError(MESSAGE_CODE, MESSAGE_FORMAT, ...) \
  GDTCORLog(MESSAGE_CODE, MESSAGE_FORMAT, __VA_ARGS__);

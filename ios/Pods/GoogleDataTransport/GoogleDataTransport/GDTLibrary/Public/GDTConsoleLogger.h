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
typedef NS_ENUM(NSInteger, GDTMessageCode) {

  /** For warning messages concerning transportBytes: not being implemented by a data object. */
  GDTMCWDataObjectMissingBytesImpl = 1,

  /** For warning messages concerning a failed event upload. */
  GDTMCWUploadFailed = 2,

  /** For warning messages concerning a forced event upload. */
  GDTMCWForcedUpload = 3,

  /** For warning messages concerning a failed reachability call. */
  GDTMCWReachabilityFailed = 4,

  /** For error messages concerning transform: not being implemented by an event transformer. */
  GDTMCETransformerDoesntImplementTransform = 1000,

  /** For error messages concerning the creation of a directory failing. */
  GDTMCEDirectoryCreationError = 1001,

  /** For error messages concerning the writing of a event file. */
  GDTMCEFileWriteError = 1002,

  /** For error messages concerning the lack of a prioritizer for a given backend. */
  GDTMCEPrioritizerError = 1003,

  /** For error messages concerning a package delivery API violation. */
  GDTMCEDeliverTwice = 1004,

  /** For error messages concerning an error in an implementation of -transportBytes. */
  GDTMCETransportBytesError = 1005,

  /** For general purpose error messages in a dependency. */
  GDTMCEGeneralError = 1006
};

/** */
FOUNDATION_EXPORT
void GDTLog(GDTMessageCode code, NSString *_Nonnull format, ...);

/** Returns the string that represents some message code.
 *
 * @param code The code to convert to a string.
 * @return The string representing the message code.
 */
FOUNDATION_EXPORT NSString *_Nonnull GDTMessageCodeEnumToString(GDTMessageCode code);

// A define to wrap GULLogWarning with slightly more convenient usage.
#define GDTLogWarning(MESSAGE_CODE, MESSAGE_FORMAT, ...) \
  GDTLog(MESSAGE_CODE, MESSAGE_FORMAT, __VA_ARGS__);

// A define to wrap GULLogError with slightly more convenient usage and a failing assert.
#define GDTLogError(MESSAGE_CODE, MESSAGE_FORMAT, ...) \
  GDTLog(MESSAGE_CODE, MESSAGE_FORMAT, __VA_ARGS__);

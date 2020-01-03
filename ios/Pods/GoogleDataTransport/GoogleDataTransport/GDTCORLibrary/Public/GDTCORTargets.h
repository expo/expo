/*
 * Copyright 2019 Google
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

/** The list of targets supported by the shared transport infrastructure. If adding a new target,
 * please use the previous value +1.
 */
typedef NS_ENUM(NSInteger, GDTCORTarget) {

  /** A target only used in testing. */
  kGDTCORTargetTest = 999,

  /** The CCT target. */
  kGDTCORTargetCCT = 1000,

  /** The FLL target. */
  kGDTCORTargetFLL = 1001,
};

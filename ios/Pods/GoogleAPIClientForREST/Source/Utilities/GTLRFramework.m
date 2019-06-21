/* Copyright (c) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !__has_feature(objc_arc)
#error "This file needs to be compiled with ARC enabled."
#endif

#include "GTLRFramework.h"

void GTLRFrameworkVersion(NSUInteger* major, NSUInteger* minor, NSUInteger* release) {
  // version 3.0.0
  if (major)   *major = 3;
  if (minor)   *minor = 0;
  if (release) *release = 0;
}

NSString *GTLRFrameworkVersionString(void) {
  NSUInteger major, minor, release;
  NSString *libVersionString;

  GTLRFrameworkVersion(&major, &minor, &release);

  // most library releases will have a release value of zero
  if (release != 0) {
    libVersionString = [NSString stringWithFormat:@"%d.%d.%d",
                        (int)major, (int)minor, (int)release];
  } else {
    libVersionString = [NSString stringWithFormat:@"%d.%d",
                        (int)major, (int)minor];
  }
  return libVersionString;
}

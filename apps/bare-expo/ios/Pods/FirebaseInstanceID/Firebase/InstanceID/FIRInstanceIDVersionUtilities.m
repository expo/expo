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

#import "FIRInstanceIDVersionUtilities.h"

// Convert the macro to a string
#define STR(x) STR_EXPAND(x)
#define STR_EXPAND(x) #x

static NSString *const kSemanticVersioningSeparator = @".";
static NSString *const kBetaVersionPrefix = @"-beta";

static NSString *libraryVersion;

static int majorVersion;
static int minorVersion;
static int patchVersion;
static int betaVersion;

void FIRInstanceIDParseCurrentLibraryVersion() {
  static NSArray *allVersions;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSMutableString *daylightVersion =
        [NSMutableString stringWithUTF8String:STR(FIRInstanceID_LIB_VERSION)];
    // Parse versions
    // major, minor, patch[-beta#]
    allVersions = [daylightVersion componentsSeparatedByString:kSemanticVersioningSeparator];
    if (allVersions.count == 3) {
      majorVersion = [allVersions[0] intValue];
      minorVersion = [allVersions[1] intValue];

      // Parse patch and beta versions
      NSArray *patchAndBetaVersion =
          [allVersions[2] componentsSeparatedByString:kBetaVersionPrefix];
      if (patchAndBetaVersion.count == 2) {
        patchVersion = [patchAndBetaVersion[0] intValue];
        betaVersion = [patchAndBetaVersion[1] intValue];
      } else if (patchAndBetaVersion.count == 1) {
        patchVersion = [patchAndBetaVersion[0] intValue];
      }
    }

    // Copy library version
    libraryVersion = [daylightVersion copy];
  });
}

NSString *FIRInstanceIDCurrentLibraryVersion() {
  FIRInstanceIDParseCurrentLibraryVersion();
  return libraryVersion;
}

int FIRInstanceIDCurrentLibraryVersionMajor() {
  FIRInstanceIDParseCurrentLibraryVersion();
  return majorVersion;
}

int FIRInstanceIDCurrentLibraryVersionMinor() {
  FIRInstanceIDParseCurrentLibraryVersion();
  return minorVersion;
}

int FIRInstanceIDCurrentLibraryVersionPatch() {
  FIRInstanceIDParseCurrentLibraryVersion();
  return patchVersion;
}

BOOL FIRInstanceIDCurrentLibraryVersionIsBeta() {
  FIRInstanceIDParseCurrentLibraryVersion();
  return betaVersion > 0;
}

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

#import "Private/FIRDiagnosticsData.h"

#import <FirebaseCore/FIRApp.h>

#import "Private/FIRAppInternal.h"
#import "Private/FIROptionsInternal.h"

@implementation FIRDiagnosticsData {
  /** Backing ivar for the diagnosticObjects property. */
  NSMutableDictionary<NSString *, id> *_diagnosticObjects;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _diagnosticObjects = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)insertValue:(nullable id)value forKey:(NSString *)key {
  if (key) {
    _diagnosticObjects[key] = value;
  }
}

#pragma mark - FIRCoreDiagnosticsData

- (NSDictionary<NSString *, id> *)diagnosticObjects {
  if (!_diagnosticObjects[kFIRCDllAppsCountKey]) {
    _diagnosticObjects[kFIRCDllAppsCountKey] = @([FIRApp allApps].count);
  }
  if (!_diagnosticObjects[kFIRCDIsDataCollectionDefaultEnabledKey]) {
    _diagnosticObjects[kFIRCDIsDataCollectionDefaultEnabledKey] =
        @([[FIRApp defaultApp] isDataCollectionDefaultEnabled]);
  }
  if (!_diagnosticObjects[kFIRCDFirebaseUserAgentKey]) {
    _diagnosticObjects[kFIRCDFirebaseUserAgentKey] = [FIRApp firebaseUserAgent];
  }
  return _diagnosticObjects;
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-parameter"
- (void)setDiagnosticObjects:(NSDictionary<NSString *, id> *)diagnosticObjects {
  NSAssert(NO, @"Please use -insertValue:forKey:");
}
#pragma clang diagnostic pop

@end

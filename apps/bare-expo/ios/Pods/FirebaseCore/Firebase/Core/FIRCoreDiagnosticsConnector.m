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

#import "Private/FIRCoreDiagnosticsConnector.h"

#import <FirebaseCoreDiagnosticsInterop/FIRCoreDiagnosticsInterop.h>

#import <FirebaseCore/FIROptions.h>

#import "Private/FIRAppInternal.h"
#import "Private/FIRDiagnosticsData.h"
#import "Private/FIROptionsInternal.h"

// Define the interop class symbol declared as an extern in FIRCoreDiagnosticsInterop.
Class<FIRCoreDiagnosticsInterop> FIRCoreDiagnosticsImplementation;

@implementation FIRCoreDiagnosticsConnector

+ (void)initialize {
  if (!FIRCoreDiagnosticsImplementation) {
    FIRCoreDiagnosticsImplementation = NSClassFromString(@"FIRCoreDiagnostics");
    if (FIRCoreDiagnosticsImplementation) {
      NSAssert([FIRCoreDiagnosticsImplementation
                   conformsToProtocol:@protocol(FIRCoreDiagnosticsInterop)],
               @"If FIRCoreDiagnostics is implemented, it must conform to the interop protocol.");
      NSAssert(
          [FIRCoreDiagnosticsImplementation respondsToSelector:@selector(sendDiagnosticsData:)],
          @"If FIRCoreDiagnostics is implemented, it must implement +sendDiagnosticsData.");
    }
  }
}

+ (void)logCoreTelemetryWithOptions:(FIROptions *)options {
  if (FIRCoreDiagnosticsImplementation) {
    FIRDiagnosticsData *diagnosticsData = [[FIRDiagnosticsData alloc] init];
    [diagnosticsData insertValue:@(YES) forKey:kFIRCDIsDataCollectionDefaultEnabledKey];
    [diagnosticsData insertValue:[FIRApp firebaseUserAgent] forKey:kFIRCDFirebaseUserAgentKey];
    [diagnosticsData insertValue:@(FIRConfigTypeCore) forKey:kFIRCDConfigurationTypeKey];
    [diagnosticsData insertValue:options.googleAppID forKey:kFIRCDGoogleAppIDKey];
    [diagnosticsData insertValue:options.bundleID forKey:kFIRCDBundleIDKey];
    [diagnosticsData insertValue:@(options.usingOptionsFromDefaultPlist)
                          forKey:kFIRCDUsingOptionsFromDefaultPlistKey];
    [diagnosticsData insertValue:options.libraryVersionID forKey:kFIRCDLibraryVersionIDKey];
    [FIRCoreDiagnosticsImplementation sendDiagnosticsData:diagnosticsData];
  }
}

@end

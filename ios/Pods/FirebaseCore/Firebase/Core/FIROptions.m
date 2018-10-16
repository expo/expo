// Copyright 2017 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "Private/FIRAppInternal.h"
#import "Private/FIRBundleUtil.h"
#import "Private/FIRErrors.h"
#import "Private/FIRLogger.h"
#import "Private/FIROptionsInternal.h"

// Keys for the strings in the plist file.
NSString *const kFIRAPIKey = @"API_KEY";
NSString *const kFIRTrackingID = @"TRACKING_ID";
NSString *const kFIRGoogleAppID = @"GOOGLE_APP_ID";
NSString *const kFIRClientID = @"CLIENT_ID";
NSString *const kFIRGCMSenderID = @"GCM_SENDER_ID";
NSString *const kFIRAndroidClientID = @"ANDROID_CLIENT_ID";
NSString *const kFIRDatabaseURL = @"DATABASE_URL";
NSString *const kFIRStorageBucket = @"STORAGE_BUCKET";
// The key to locate the expected bundle identifier in the plist file.
NSString *const kFIRBundleID = @"BUNDLE_ID";
// The key to locate the project identifier in the plist file.
NSString *const kFIRProjectID = @"PROJECT_ID";

NSString *const kFIRIsMeasurementEnabled = @"IS_MEASUREMENT_ENABLED";
NSString *const kFIRIsAnalyticsCollectionEnabled = @"FIREBASE_ANALYTICS_COLLECTION_ENABLED";
NSString *const kFIRIsAnalyticsCollectionDeactivated = @"FIREBASE_ANALYTICS_COLLECTION_DEACTIVATED";

NSString *const kFIRIsAnalyticsEnabled = @"IS_ANALYTICS_ENABLED";
NSString *const kFIRIsSignInEnabled = @"IS_SIGNIN_ENABLED";

// Library version ID.
NSString *const kFIRLibraryVersionID =
    @"5"     // Major version (one or more digits)
    @"00"    // Minor version (exactly 2 digits)
    @"06"    // Build number (exactly 2 digits)
    @"000";  // Fixed "000"
// Plist file name.
NSString *const kServiceInfoFileName = @"GoogleService-Info";
// Plist file type.
NSString *const kServiceInfoFileType = @"plist";

// Exception raised from attempting to modify a FIROptions after it's been copied to a FIRApp.
NSString *const kFIRExceptionBadModification =
    @"Attempted to modify options after it's set on FIRApp. Please modify all properties before "
    @"initializing FIRApp.";

@interface FIROptions ()

/**
 * This property maintains the actual configuration key-value pairs.
 */
@property(nonatomic, readwrite) NSMutableDictionary *optionsDictionary;

/**
 * Calls `analyticsOptionsDictionaryWithInfoDictionary:` using [NSBundle mainBundle].infoDictionary.
 * It combines analytics options from both the infoDictionary and the GoogleService-Info.plist.
 * Values which are present in the main plist override values from the GoogleService-Info.plist.
 */
@property(nonatomic, readonly) NSDictionary *analyticsOptionsDictionary;

/**
 * Combination of analytics options from both the infoDictionary and the GoogleService-Info.plist.
 * Values which are present in the infoDictionary override values from the GoogleService-Info.plist.
 */
- (NSDictionary *)analyticsOptionsDictionaryWithInfoDictionary:(NSDictionary *)infoDictionary;

/**
 * Throw exception if editing is locked when attempting to modify an option.
 */
- (void)checkEditingLocked;

@end

@implementation FIROptions {
  /// Backing variable for self.analyticsOptionsDictionary.
  NSDictionary *_analyticsOptionsDictionary;
  dispatch_once_t _createAnalyticsOptionsDictionaryOnce;
}

static FIROptions *sDefaultOptions = nil;
static NSDictionary *sDefaultOptionsDictionary = nil;

#pragma mark - Public only for internal class methods

+ (FIROptions *)defaultOptions {
  if (sDefaultOptions != nil) {
    return sDefaultOptions;
  }

  NSDictionary *defaultOptionsDictionary = [self defaultOptionsDictionary];
  if (defaultOptionsDictionary == nil) {
    return nil;
  }

  sDefaultOptions = [[FIROptions alloc] initInternalWithOptionsDictionary:defaultOptionsDictionary];
  return sDefaultOptions;
}

#pragma mark - Private class methods

+ (void)initialize {
  // Report FirebaseCore version for useragent string
  NSRange major = NSMakeRange(0, 1);
  NSRange minor = NSMakeRange(1, 2);
  NSRange patch = NSMakeRange(3, 2);
  [FIRApp
      registerLibrary:@"fire-ios"
          withVersion:[NSString stringWithFormat:@"%@.%d.%d",
                                                 [kFIRLibraryVersionID substringWithRange:major],
                                                 [[kFIRLibraryVersionID substringWithRange:minor]
                                                     intValue],
                                                 [[kFIRLibraryVersionID substringWithRange:patch]
                                                     intValue]]];
  NSDictionary<NSString *, id> *info = [[NSBundle mainBundle] infoDictionary];
  NSString *xcodeVersion = info[@"DTXcodeBuild"];
  NSString *sdkVersion = info[@"DTSDKBuild"];
  if (xcodeVersion) {
    [FIRApp registerLibrary:@"xcode" withVersion:xcodeVersion];
  }
  if (sdkVersion) {
    [FIRApp registerLibrary:@"apple-sdk" withVersion:sdkVersion];
  }
}

+ (NSDictionary *)defaultOptionsDictionary {
  if (sDefaultOptionsDictionary != nil) {
    return sDefaultOptionsDictionary;
  }
  NSString *plistFilePath = [FIROptions plistFilePathWithName:kServiceInfoFileName];
  if (plistFilePath == nil) {
    return nil;
  }
  sDefaultOptionsDictionary = [NSDictionary dictionaryWithContentsOfFile:plistFilePath];
  if (sDefaultOptionsDictionary == nil) {
    FIRLogError(kFIRLoggerCore, @"I-COR000011",
                @"The configuration file is not a dictionary: "
                @"'%@.%@'.",
                kServiceInfoFileName, kServiceInfoFileType);
  }
  return sDefaultOptionsDictionary;
}

// Returns the path of the plist file with a given file name.
+ (NSString *)plistFilePathWithName:(NSString *)fileName {
  NSArray *bundles = [FIRBundleUtil relevantBundles];
  NSString *plistFilePath =
      [FIRBundleUtil optionsDictionaryPathWithResourceName:fileName
                                               andFileType:kServiceInfoFileType
                                                 inBundles:bundles];
  if (plistFilePath == nil) {
    FIRLogError(kFIRLoggerCore, @"I-COR000012", @"Could not locate configuration file: '%@.%@'.",
                fileName, kServiceInfoFileType);
  }
  return plistFilePath;
}

+ (void)resetDefaultOptions {
  sDefaultOptions = nil;
  sDefaultOptionsDictionary = nil;
}

#pragma mark - Private instance methods

- (instancetype)initInternalWithOptionsDictionary:(NSDictionary *)optionsDictionary {
  self = [super init];
  if (self) {
    _optionsDictionary = [optionsDictionary mutableCopy];
    _usingOptionsFromDefaultPlist = YES;
  }
  return self;
}

- (id)copyWithZone:(NSZone *)zone {
  FIROptions *newOptions = [[[self class] allocWithZone:zone] init];
  if (newOptions) {
    newOptions.optionsDictionary = self.optionsDictionary;
    newOptions.deepLinkURLScheme = self.deepLinkURLScheme;
    newOptions.editingLocked = self.isEditingLocked;
    newOptions.usingOptionsFromDefaultPlist = self.usingOptionsFromDefaultPlist;
  }
  return newOptions;
}

#pragma mark - Public instance methods

- (instancetype)initWithContentsOfFile:(NSString *)plistPath {
  self = [super init];
  if (self) {
    if (plistPath == nil) {
      FIRLogError(kFIRLoggerCore, @"I-COR000013", @"The plist file path is nil.");
      return nil;
    }
    _optionsDictionary = [[NSDictionary dictionaryWithContentsOfFile:plistPath] mutableCopy];
    if (_optionsDictionary == nil) {
      FIRLogError(kFIRLoggerCore, @"I-COR000014",
                  @"The configuration file at %@ does not exist or "
                  @"is not a well-formed plist file.",
                  plistPath);
      return nil;
    }
    // TODO: Do we want to validate the dictionary here? It says we do that already in
    // the public header.
  }
  return self;
}

- (instancetype)initWithGoogleAppID:(NSString *)googleAppID GCMSenderID:(NSString *)GCMSenderID {
  self = [super init];
  if (self) {
    NSMutableDictionary *mutableOptionsDict = [NSMutableDictionary dictionary];
    [mutableOptionsDict setValue:googleAppID forKey:kFIRGoogleAppID];
    [mutableOptionsDict setValue:GCMSenderID forKey:kFIRGCMSenderID];
    [mutableOptionsDict setValue:[[NSBundle mainBundle] bundleIdentifier] forKey:kFIRBundleID];
    self.optionsDictionary = mutableOptionsDict;
  }
  return self;
}

- (NSString *)APIKey {
  return self.optionsDictionary[kFIRAPIKey];
}

- (void)checkEditingLocked {
  if (self.isEditingLocked) {
    [NSException raise:kFirebaseCoreErrorDomain format:kFIRExceptionBadModification];
  }
}

- (void)setAPIKey:(NSString *)APIKey {
  [self checkEditingLocked];
  _optionsDictionary[kFIRAPIKey] = [APIKey copy];
}

- (NSString *)clientID {
  return self.optionsDictionary[kFIRClientID];
}

- (void)setClientID:(NSString *)clientID {
  [self checkEditingLocked];
  _optionsDictionary[kFIRClientID] = [clientID copy];
}

- (NSString *)trackingID {
  return self.optionsDictionary[kFIRTrackingID];
}

- (void)setTrackingID:(NSString *)trackingID {
  [self checkEditingLocked];
  _optionsDictionary[kFIRTrackingID] = [trackingID copy];
}

- (NSString *)GCMSenderID {
  return self.optionsDictionary[kFIRGCMSenderID];
}

- (void)setGCMSenderID:(NSString *)GCMSenderID {
  [self checkEditingLocked];
  _optionsDictionary[kFIRGCMSenderID] = [GCMSenderID copy];
}

- (NSString *)projectID {
  return self.optionsDictionary[kFIRProjectID];
}

- (void)setProjectID:(NSString *)projectID {
  [self checkEditingLocked];
  _optionsDictionary[kFIRProjectID] = [projectID copy];
}

- (NSString *)androidClientID {
  return self.optionsDictionary[kFIRAndroidClientID];
}

- (void)setAndroidClientID:(NSString *)androidClientID {
  [self checkEditingLocked];
  _optionsDictionary[kFIRAndroidClientID] = [androidClientID copy];
}

- (NSString *)googleAppID {
  return self.optionsDictionary[kFIRGoogleAppID];
}

- (void)setGoogleAppID:(NSString *)googleAppID {
  [self checkEditingLocked];
  _optionsDictionary[kFIRGoogleAppID] = [googleAppID copy];
}

- (NSString *)libraryVersionID {
  return kFIRLibraryVersionID;
}

- (void)setLibraryVersionID:(NSString *)libraryVersionID {
  _optionsDictionary[kFIRLibraryVersionID] = [libraryVersionID copy];
}

- (NSString *)databaseURL {
  return self.optionsDictionary[kFIRDatabaseURL];
}

- (void)setDatabaseURL:(NSString *)databaseURL {
  [self checkEditingLocked];

  _optionsDictionary[kFIRDatabaseURL] = [databaseURL copy];
}

- (NSString *)storageBucket {
  return self.optionsDictionary[kFIRStorageBucket];
}

- (void)setStorageBucket:(NSString *)storageBucket {
  [self checkEditingLocked];
  _optionsDictionary[kFIRStorageBucket] = [storageBucket copy];
}

- (void)setDeepLinkURLScheme:(NSString *)deepLinkURLScheme {
  [self checkEditingLocked];
  _deepLinkURLScheme = [deepLinkURLScheme copy];
}

- (NSString *)bundleID {
  return self.optionsDictionary[kFIRBundleID];
}

- (void)setBundleID:(NSString *)bundleID {
  [self checkEditingLocked];
  _optionsDictionary[kFIRBundleID] = [bundleID copy];
}

#pragma mark - Internal instance methods

- (NSDictionary *)analyticsOptionsDictionaryWithInfoDictionary:(NSDictionary *)infoDictionary {
  dispatch_once(&_createAnalyticsOptionsDictionaryOnce, ^{
    NSMutableDictionary *tempAnalyticsOptions = [[NSMutableDictionary alloc] init];
    NSArray *measurementKeys = @[
      kFIRIsMeasurementEnabled, kFIRIsAnalyticsCollectionEnabled,
      kFIRIsAnalyticsCollectionDeactivated
    ];
    for (NSString *key in measurementKeys) {
      id value = infoDictionary[key] ?: self.optionsDictionary[key] ?: nil;
      if (!value) {
        continue;
      }
      tempAnalyticsOptions[key] = value;
    }
    self->_analyticsOptionsDictionary = tempAnalyticsOptions;
  });
  return _analyticsOptionsDictionary;
}

- (NSDictionary *)analyticsOptionsDictionary {
  return [self analyticsOptionsDictionaryWithInfoDictionary:[NSBundle mainBundle].infoDictionary];
}

/**
 * Whether or not Measurement was enabled. Measurement is enabled unless explicitly disabled in
 * GoogleService-Info.plist. This uses the old plist flag IS_MEASUREMENT_ENABLED, which should still
 * be supported.
 */
- (BOOL)isMeasurementEnabled {
  if (self.isAnalyticsCollectionDeactivated) {
    return NO;
  }
  NSNumber *value = self.analyticsOptionsDictionary[kFIRIsMeasurementEnabled];
  if (value == nil) {
    // TODO: This could probably be cleaned up since FIROptions shouldn't know about FIRApp or have
    //       to check if it's the default app. The FIROptions instance can't be modified after
    //       `+configure` is called, so it's not a good place to copy it either in case the flag is
    //       changed at runtime.

    // If no values are set for Analytics, fall back to the global collection switch in FIRApp.
    // Analytics only supports the default FIRApp, so check that first.
    if (![FIRApp isDefaultAppConfigured]) {
      return NO;
    }

    // Fall back to the default app's collection switch when the key is not in the dictionary.
    return [FIRApp defaultApp].automaticDataCollectionEnabled;
  }
  return [value boolValue];
}

- (BOOL)isAnalyticsCollectionExpicitlySet {
  // If it's de-activated, it classifies as explicity set. If not, it's not a good enough indication
  // that the developer wants FirebaseAnalytics enabled so continue checking.
  if (self.isAnalyticsCollectionDeactivated) {
    return YES;
  }

  // Check if the current Analytics flag is set.
  id collectionEnabledObject = self.analyticsOptionsDictionary[kFIRIsAnalyticsCollectionEnabled];
  if (collectionEnabledObject && [collectionEnabledObject isKindOfClass:[NSNumber class]]) {
    // It doesn't matter what the value is, it's explicitly set.
    return YES;
  }

  // Check if the old measurement flag is set.
  id measurementEnabledObject = self.analyticsOptionsDictionary[kFIRIsMeasurementEnabled];
  if (measurementEnabledObject && [measurementEnabledObject isKindOfClass:[NSNumber class]]) {
    // It doesn't matter what the value is, it's explicitly set.
    return YES;
  }

  // No flags are set to explicitly enable or disable FirebaseAnalytics.
  return NO;
}

- (BOOL)isAnalyticsCollectionEnabled {
  if (self.isAnalyticsCollectionDeactivated) {
    return NO;
  }
  NSNumber *value = self.analyticsOptionsDictionary[kFIRIsAnalyticsCollectionEnabled];
  if (value == nil) {
    return self.isMeasurementEnabled;  // Fall back to older plist flag.
  }
  return [value boolValue];
}

- (BOOL)isAnalyticsCollectionDeactivated {
  NSNumber *value = self.analyticsOptionsDictionary[kFIRIsAnalyticsCollectionDeactivated];
  if (value == nil) {
    return NO;  // Analytics Collection is not deactivated when the key is not in the dictionary.
  }
  return [value boolValue];
}

- (BOOL)isAnalyticsEnabled {
  return [self.optionsDictionary[kFIRIsAnalyticsEnabled] boolValue];
}

- (BOOL)isSignInEnabled {
  return [self.optionsDictionary[kFIRIsSignInEnabled] boolValue];
}

@end

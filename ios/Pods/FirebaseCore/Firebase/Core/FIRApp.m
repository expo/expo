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

#include <sys/utsname.h>

#import "FIRApp.h"
#import "Private/FIRAnalyticsConfiguration.h"
#import "Private/FIRAppInternal.h"
#import "Private/FIRBundleUtil.h"
#import "Private/FIRComponentContainerInternal.h"
#import "Private/FIRConfigurationInternal.h"
#import "Private/FIRLibrary.h"
#import "Private/FIRLogger.h"
#import "Private/FIROptionsInternal.h"

NSString *const kFIRServiceAdMob = @"AdMob";
NSString *const kFIRServiceAuth = @"Auth";
NSString *const kFIRServiceAuthUI = @"AuthUI";
NSString *const kFIRServiceCrash = @"Crash";
NSString *const kFIRServiceDatabase = @"Database";
NSString *const kFIRServiceDynamicLinks = @"DynamicLinks";
NSString *const kFIRServiceFirestore = @"Firestore";
NSString *const kFIRServiceFunctions = @"Functions";
NSString *const kFIRServiceInstanceID = @"InstanceID";
NSString *const kFIRServiceInvites = @"Invites";
NSString *const kFIRServiceMessaging = @"Messaging";
NSString *const kFIRServiceMeasurement = @"Measurement";
NSString *const kFIRServicePerformance = @"Performance";
NSString *const kFIRServiceRemoteConfig = @"RemoteConfig";
NSString *const kFIRServiceStorage = @"Storage";
NSString *const kGGLServiceAnalytics = @"Analytics";
NSString *const kGGLServiceSignIn = @"SignIn";

NSString *const kFIRDefaultAppName = @"__FIRAPP_DEFAULT";
NSString *const kFIRAppReadyToConfigureSDKNotification = @"FIRAppReadyToConfigureSDKNotification";
NSString *const kFIRAppDeleteNotification = @"FIRAppDeleteNotification";
NSString *const kFIRAppIsDefaultAppKey = @"FIRAppIsDefaultAppKey";
NSString *const kFIRAppNameKey = @"FIRAppNameKey";
NSString *const kFIRGoogleAppIDKey = @"FIRGoogleAppIDKey";

NSString *const kFIRGlobalAppDataCollectionEnabledDefaultsKeyFormat =
    @"/google/firebase/global_data_collection_enabled:%@";
NSString *const kFIRGlobalAppDataCollectionEnabledPlistKey =
    @"FirebaseDataCollectionDefaultEnabled";

NSString *const kFIRAppDiagnosticsNotification = @"FIRAppDiagnosticsNotification";

NSString *const kFIRAppDiagnosticsConfigurationTypeKey = @"ConfigType";
NSString *const kFIRAppDiagnosticsErrorKey = @"Error";
NSString *const kFIRAppDiagnosticsFIRAppKey = @"FIRApp";
NSString *const kFIRAppDiagnosticsSDKNameKey = @"SDKName";
NSString *const kFIRAppDiagnosticsSDKVersionKey = @"SDKVersion";

// Auth internal notification notification and key.
NSString *const FIRAuthStateDidChangeInternalNotification =
    @"FIRAuthStateDidChangeInternalNotification";
NSString *const FIRAuthStateDidChangeInternalNotificationAppKey =
    @"FIRAuthStateDidChangeInternalNotificationAppKey";
NSString *const FIRAuthStateDidChangeInternalNotificationTokenKey =
    @"FIRAuthStateDidChangeInternalNotificationTokenKey";
NSString *const FIRAuthStateDidChangeInternalNotificationUIDKey =
    @"FIRAuthStateDidChangeInternalNotificationUIDKey";

/**
 * The URL to download plist files.
 */
static NSString *const kPlistURL = @"https://console.firebase.google.com/";

/**
 * An array of all classes that registered as `FIRCoreConfigurable` in order to receive lifecycle
 * events from Core.
 */
static NSMutableArray<Class<FIRLibrary>> *sRegisteredAsConfigurable;

@interface FIRApp ()

#ifdef DEBUG
@property(nonatomic) BOOL alreadyOutputDataCollectionFlag;
#endif  // DEBUG

@end

@implementation FIRApp

// This is necessary since our custom getter prevents `_options` from being created.
@synthesize options = _options;

static NSMutableDictionary *sAllApps;
static FIRApp *sDefaultApp;
static NSMutableDictionary *sLibraryVersions;

+ (void)configure {
  FIROptions *options = [FIROptions defaultOptions];
  if (!options) {
    // Read the Info.plist to see if the flag is set. At this point we can't check any user defaults
    // since the app isn't configured at all, so only rely on the Info.plist value.
    NSNumber *collectionEnabledPlistValue = [[self class] readDataCollectionSwitchFromPlist];
    if (collectionEnabledPlistValue == nil || [collectionEnabledPlistValue boolValue]) {
      [[NSNotificationCenter defaultCenter]
          postNotificationName:kFIRAppDiagnosticsNotification
                        object:nil
                      userInfo:@{
                        kFIRAppDiagnosticsConfigurationTypeKey : @(FIRConfigTypeCore),
                        kFIRAppDiagnosticsErrorKey : [FIRApp errorForMissingOptions]
                      }];
    }

    [NSException raise:kFirebaseCoreErrorDomain
                format:@"`[FIRApp configure];` (`FirebaseApp.configure()` in Swift) could not find "
                       @"a valid GoogleService-Info.plist in your project. Please download one "
                       @"from %@.",
                       kPlistURL];
  }
  [FIRApp configureWithOptions:options];
#if TARGET_OS_OSX || TARGET_OS_TV
  FIRLogNotice(kFIRLoggerCore, @"I-COR000028",
               @"tvOS and macOS SDK support is not part of the official Firebase product. "
               @"Instead they are community supported. Details at "
               @"https://github.com/firebase/firebase-ios-sdk/blob/master/README.md.");
#endif
}

+ (void)configureWithOptions:(FIROptions *)options {
  if (!options) {
    [NSException raise:kFirebaseCoreErrorDomain
                format:@"Options is nil. Please pass a valid options."];
  }
  [FIRApp configureWithName:kFIRDefaultAppName options:options];
}

+ (void)configureWithName:(NSString *)name options:(FIROptions *)options {
  if (!name || !options) {
    [NSException raise:kFirebaseCoreErrorDomain format:@"Neither name nor options can be nil."];
  }
  if (name.length == 0) {
    [NSException raise:kFirebaseCoreErrorDomain format:@"Name cannot be empty."];
  }

  if ([name isEqualToString:kFIRDefaultAppName]) {
    if (sDefaultApp) {
      [NSException raise:kFirebaseCoreErrorDomain
                  format:@"Default app has already been configured."];
    }

    FIRLogDebug(kFIRLoggerCore, @"I-COR000001", @"Configuring the default app.");
  } else {
    // Validate the app name and ensure it hasn't been configured already.
    for (NSUInteger charIndex = 0; charIndex < name.length; charIndex++) {
      char character = [name characterAtIndex:charIndex];
      if (!((character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z') ||
            (character >= '0' && character <= '9') || character == '_' || character == '-')) {
        [NSException raise:kFirebaseCoreErrorDomain
                    format:@"App name can only contain alphanumeric (A-Z,a-z,0-9), "
                           @"hyphen (-), and underscore (_) characters"];
      }
    }

    @synchronized(self) {
      if (sAllApps && sAllApps[name]) {
        [NSException raise:kFirebaseCoreErrorDomain
                    format:@"App named %@ has already been configured.", name];
      }
    }

    FIRLogDebug(kFIRLoggerCore, @"I-COR000002", @"Configuring app named %@", name);
  }

  @synchronized(self) {
    FIRApp *app = [[FIRApp alloc] initInstanceWithName:name options:options];
    if (app.isDefaultApp) {
      sDefaultApp = app;
    }

    [FIRApp addAppToAppDictionary:app];
    [FIRApp sendNotificationsToSDKs:app];
  }
}

+ (FIRApp *)defaultApp {
  if (sDefaultApp) {
    return sDefaultApp;
  }
  FIRLogError(kFIRLoggerCore, @"I-COR000003",
              @"The default Firebase app has not yet been "
              @"configured. Add `[FIRApp configure];` (`FirebaseApp.configure()` in Swift) to your "
              @"application initialization. Read more: https://goo.gl/ctyzm8.");
  return nil;
}

+ (FIRApp *)appNamed:(NSString *)name {
  @synchronized(self) {
    if (sAllApps) {
      FIRApp *app = sAllApps[name];
      if (app) {
        return app;
      }
    }
    FIRLogError(kFIRLoggerCore, @"I-COR000004", @"App with name %@ does not exist.", name);
    return nil;
  }
}

+ (NSDictionary *)allApps {
  @synchronized(self) {
    if (!sAllApps) {
      FIRLogError(kFIRLoggerCore, @"I-COR000005", @"No app has been configured yet.");
    }
    return [sAllApps copy];
  }
}

// Public only for tests
+ (void)resetApps {
  @synchronized(self) {
    sDefaultApp = nil;
    [sAllApps removeAllObjects];
    sAllApps = nil;
    [sLibraryVersions removeAllObjects];
    sLibraryVersions = nil;
  }
}

- (void)deleteApp:(FIRAppVoidBoolCallback)completion {
  @synchronized([self class]) {
    if (sAllApps && sAllApps[self.name]) {
      FIRLogDebug(kFIRLoggerCore, @"I-COR000006", @"Deleting app named %@", self.name);

      // Remove all cached instances from the container before deleting the app.
      [self.container removeAllCachedInstances];

      [sAllApps removeObjectForKey:self.name];
      [self clearDataCollectionSwitchFromUserDefaults];
      if ([self.name isEqualToString:kFIRDefaultAppName]) {
        sDefaultApp = nil;
      }
      NSDictionary *appInfoDict = @{kFIRAppNameKey : self.name};
      [[NSNotificationCenter defaultCenter] postNotificationName:kFIRAppDeleteNotification
                                                          object:[self class]
                                                        userInfo:appInfoDict];
      completion(YES);
    } else {
      FIRLogError(kFIRLoggerCore, @"I-COR000007", @"App does not exist.");
      completion(NO);
    }
  }
}

+ (void)addAppToAppDictionary:(FIRApp *)app {
  if (!sAllApps) {
    sAllApps = [NSMutableDictionary dictionary];
  }
  if ([app configureCore]) {
    sAllApps[app.name] = app;
  } else {
    [NSException raise:kFirebaseCoreErrorDomain
                format:@"Configuration fails. It may be caused by an invalid GOOGLE_APP_ID in "
                       @"GoogleService-Info.plist or set in the customized options."];
  }
}

- (instancetype)initInstanceWithName:(NSString *)name options:(FIROptions *)options {
  self = [super init];
  if (self) {
    _name = [name copy];
    _options = [options copy];
    _options.editingLocked = YES;
    _isDefaultApp = [name isEqualToString:kFIRDefaultAppName];
    _container = [[FIRComponentContainer alloc] initWithApp:self];
  }
  return self;
}

- (BOOL)configureCore {
  [self checkExpectedBundleID];
  if (![self isAppIDValid]) {
    if (_options.usingOptionsFromDefaultPlist && [self isDataCollectionDefaultEnabled]) {
      [[NSNotificationCenter defaultCenter]
          postNotificationName:kFIRAppDiagnosticsNotification
                        object:nil
                      userInfo:@{
                        kFIRAppDiagnosticsConfigurationTypeKey : @(FIRConfigTypeCore),
                        kFIRAppDiagnosticsErrorKey : [FIRApp errorForInvalidAppID],
                      }];
    }
    return NO;
  }

  if ([self isDataCollectionDefaultEnabled]) {
    [[NSNotificationCenter defaultCenter]
        postNotificationName:kFIRAppDiagnosticsNotification
                      object:nil
                    userInfo:@{
                      kFIRAppDiagnosticsConfigurationTypeKey : @(FIRConfigTypeCore),
                      kFIRAppDiagnosticsFIRAppKey : self
                    }];
  }

#if TARGET_OS_IOS
  // Initialize the Analytics once there is a valid options under default app. Analytics should
  // always initialize first by itself before the other SDKs.
  if ([self.name isEqualToString:kFIRDefaultAppName]) {
    Class firAnalyticsClass = NSClassFromString(@"FIRAnalytics");
    if (firAnalyticsClass) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
      SEL startWithConfigurationSelector = @selector(startWithConfiguration:options:);
#pragma clang diagnostic pop
      if ([firAnalyticsClass respondsToSelector:startWithConfigurationSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        [firAnalyticsClass performSelector:startWithConfigurationSelector
                                withObject:[FIRConfiguration sharedInstance].analyticsConfiguration
                                withObject:_options];
#pragma clang diagnostic pop
      }
    }
  }
#endif

  return YES;
}

- (FIROptions *)options {
  return [_options copy];
}

- (void)setDataCollectionDefaultEnabled:(BOOL)dataCollectionDefaultEnabled {
#ifdef DEBUG
  FIRLogDebug(kFIRLoggerCore, @"I-COR000034", @"Explicitly %@ data collection flag.",
              dataCollectionDefaultEnabled ? @"enabled" : @"disabled");
  self.alreadyOutputDataCollectionFlag = YES;
#endif  // DEBUG

  NSString *key =
      [NSString stringWithFormat:kFIRGlobalAppDataCollectionEnabledDefaultsKeyFormat, self.name];
  [[NSUserDefaults standardUserDefaults] setBool:dataCollectionDefaultEnabled forKey:key];

  // Core also controls the FirebaseAnalytics flag, so check if the Analytics flags are set
  // within FIROptions and change the Analytics value if necessary. Analytics only works with the
  // default app, so return if this isn't the default app.
  if (!self.isDefaultApp) {
    return;
  }

  // Check if the Analytics flag is explicitly set. If so, no further actions are necessary.
  if ([self.options isAnalyticsCollectionExpicitlySet]) {
    return;
  }

  // The Analytics flag has not been explicitly set, so update with the value being set.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [[FIRAnalyticsConfiguration sharedInstance]
      setAnalyticsCollectionEnabled:dataCollectionDefaultEnabled
                     persistSetting:NO];
#pragma clang diagnostic pop
}

- (BOOL)isDataCollectionDefaultEnabled {
  // Check if it's been manually set before in code, and use that as the higher priority value.
  NSNumber *defaultsObject = [[self class] readDataCollectionSwitchFromUserDefaultsForApp:self];
  if (defaultsObject != nil) {
#ifdef DEBUG
    if (!self.alreadyOutputDataCollectionFlag) {
      FIRLogDebug(kFIRLoggerCore, @"I-COR000031", @"Data Collection flag is %@ in user defaults.",
                  [defaultsObject boolValue] ? @"enabled" : @"disabled");
      self.alreadyOutputDataCollectionFlag = YES;
    }
#endif  // DEBUG
    return [defaultsObject boolValue];
  }

  // Read the Info.plist to see if the flag is set. If it's not set, it should default to `YES`.
  // As per the implementation of `readDataCollectionSwitchFromPlist`, it's a cached value and has
  // no performance impact calling multiple times.
  NSNumber *collectionEnabledPlistValue = [[self class] readDataCollectionSwitchFromPlist];
  if (collectionEnabledPlistValue != nil) {
#ifdef DEBUG
    if (!self.alreadyOutputDataCollectionFlag) {
      FIRLogDebug(kFIRLoggerCore, @"I-COR000032", @"Data Collection flag is %@ in plist.",
                  [collectionEnabledPlistValue boolValue] ? @"enabled" : @"disabled");
      self.alreadyOutputDataCollectionFlag = YES;
    }
#endif  // DEBUG
    return [collectionEnabledPlistValue boolValue];
  }

#ifdef DEBUG
  if (!self.alreadyOutputDataCollectionFlag) {
    FIRLogDebug(kFIRLoggerCore, @"I-COR000033", @"Data Collection flag is not set.");
    self.alreadyOutputDataCollectionFlag = YES;
  }
#endif  // DEBUG
  return YES;
}

#pragma mark - private

+ (void)sendNotificationsToSDKs:(FIRApp *)app {
  // TODO: Remove this notification once all SDKs are registered with `FIRCoreConfigurable`.
  NSNumber *isDefaultApp = [NSNumber numberWithBool:app.isDefaultApp];
  NSDictionary *appInfoDict = @{
    kFIRAppNameKey : app.name,
    kFIRAppIsDefaultAppKey : isDefaultApp,
    kFIRGoogleAppIDKey : app.options.googleAppID
  };
  [[NSNotificationCenter defaultCenter] postNotificationName:kFIRAppReadyToConfigureSDKNotification
                                                      object:self
                                                    userInfo:appInfoDict];

  // This is the new way of sending information to SDKs.
  // TODO: Do we want this on a background thread, maybe?
  @synchronized(self) {
    for (Class<FIRLibrary> library in sRegisteredAsConfigurable) {
      [library configureWithApp:app];
    }
  }
}

+ (NSError *)errorForMissingOptions {
  NSDictionary *errorDict = @{
    NSLocalizedDescriptionKey :
        @"Unable to parse GoogleService-Info.plist in order to configure services.",
    NSLocalizedRecoverySuggestionErrorKey :
        @"Check formatting and location of GoogleService-Info.plist."
  };
  return [NSError errorWithDomain:kFirebaseCoreErrorDomain
                             code:FIRErrorCodeInvalidPlistFile
                         userInfo:errorDict];
}

+ (NSError *)errorForSubspecConfigurationFailureWithDomain:(NSString *)domain
                                                 errorCode:(FIRErrorCode)code
                                                   service:(NSString *)service
                                                    reason:(NSString *)reason {
  NSString *description =
      [NSString stringWithFormat:@"Configuration failed for service %@.", service];
  NSDictionary *errorDict =
      @{NSLocalizedDescriptionKey : description, NSLocalizedFailureReasonErrorKey : reason};
  return [NSError errorWithDomain:domain code:code userInfo:errorDict];
}

+ (NSError *)errorForInvalidAppID {
  NSDictionary *errorDict = @{
    NSLocalizedDescriptionKey : @"Unable to validate Google App ID",
    NSLocalizedRecoverySuggestionErrorKey :
        @"Check formatting and location of GoogleService-Info.plist or GoogleAppID set in the "
        @"customized options."
  };
  return [NSError errorWithDomain:kFirebaseCoreErrorDomain
                             code:FIRErrorCodeInvalidAppID
                         userInfo:errorDict];
}

+ (BOOL)isDefaultAppConfigured {
  return (sDefaultApp != nil);
}

+ (void)registerLibrary:(nonnull NSString *)name withVersion:(nonnull NSString *)version {
  // Create the set of characters which aren't allowed, only if this feature is used.
  NSMutableCharacterSet *allowedSet = [NSMutableCharacterSet alphanumericCharacterSet];
  [allowedSet addCharactersInString:@"-_."];
  NSCharacterSet *disallowedSet = [allowedSet invertedSet];
  // Make sure the library name and version strings do not contain unexpected characters, and
  // add the name/version pair to the dictionary.
  if ([name rangeOfCharacterFromSet:disallowedSet].location == NSNotFound &&
      [version rangeOfCharacterFromSet:disallowedSet].location == NSNotFound) {
    @synchronized(self) {
      if (!sLibraryVersions) {
        sLibraryVersions = [[NSMutableDictionary alloc] init];
      }
      sLibraryVersions[name] = version;
    }
  } else {
    FIRLogError(kFIRLoggerCore, @"I-COR000027",
                @"The library name (%@) or version number (%@) contain invalid characters. "
                @"Only alphanumeric, dash, underscore and period characters are allowed.",
                name, version);
  }
}

+ (void)registerInternalLibrary:(nonnull Class<FIRLibrary>)library
                       withName:(nonnull NSString *)name
                    withVersion:(nonnull NSString *)version {
  // This is called at +load time, keep the work to a minimum.

  // Ensure the class given conforms to the proper protocol.
  if (![(Class)library conformsToProtocol:@protocol(FIRLibrary)] ||
      ![(Class)library respondsToSelector:@selector(componentsToRegister)]) {
    [NSException raise:NSInvalidArgumentException
                format:@"Class %@ attempted to register components, but it does not conform to "
                       @"`FIRLibrary or provide a `componentsToRegister:` method.",
                       library];
  }

  [FIRComponentContainer registerAsComponentRegistrant:library];
  if ([(Class)library respondsToSelector:@selector(configureWithApp:)]) {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      sRegisteredAsConfigurable = [[NSMutableArray alloc] init];
    });
    @synchronized(self) {
      [sRegisteredAsConfigurable addObject:library];
    }
  }
  [self registerLibrary:name withVersion:version];
}

+ (NSString *)firebaseUserAgent {
  @synchronized(self) {
    NSMutableArray<NSString *> *libraries =
        [[NSMutableArray<NSString *> alloc] initWithCapacity:sLibraryVersions.count];
    for (NSString *libraryName in sLibraryVersions) {
      [libraries addObject:[NSString stringWithFormat:@"%@/%@", libraryName,
                                                      sLibraryVersions[libraryName]]];
    }
    [libraries sortUsingSelector:@selector(localizedCaseInsensitiveCompare:)];
    return [libraries componentsJoinedByString:@" "];
  }
}

- (void)checkExpectedBundleID {
  NSArray *bundles = [FIRBundleUtil relevantBundles];
  NSString *expectedBundleID = [self expectedBundleID];
  // The checking is only done when the bundle ID is provided in the serviceInfo dictionary for
  // backward compatibility.
  if (expectedBundleID != nil && ![FIRBundleUtil hasBundleIdentifierPrefix:expectedBundleID
                                                                 inBundles:bundles]) {
    FIRLogError(kFIRLoggerCore, @"I-COR000008",
                @"The project's Bundle ID is inconsistent with "
                @"either the Bundle ID in '%@.%@', or the Bundle ID in the options if you are "
                @"using a customized options. To ensure that everything can be configured "
                @"correctly, you may need to make the Bundle IDs consistent. To continue with this "
                @"plist file, you may change your app's bundle identifier to '%@'. Or you can "
                @"download a new configuration file that matches your bundle identifier from %@ "
                @"and replace the current one.",
                kServiceInfoFileName, kServiceInfoFileType, expectedBundleID, kPlistURL);
  }
}

#pragma mark - private - App ID Validation

/**
 * Validates the format and fingerprint of the app ID contained in GOOGLE_APP_ID in the plist file.
 * This is the main method for validating app ID.
 *
 * @return YES if the app ID fulfills the expected format and fingerprint, NO otherwise.
 */
- (BOOL)isAppIDValid {
  NSString *appID = _options.googleAppID;
  BOOL isValid = [FIRApp validateAppID:appID];
  if (!isValid) {
    NSString *expectedBundleID = [self expectedBundleID];
    FIRLogError(kFIRLoggerCore, @"I-COR000009",
                @"The GOOGLE_APP_ID either in the plist file "
                @"'%@.%@' or the one set in the customized options is invalid. If you are using "
                @"the plist file, use the iOS version of bundle identifier to download the file, "
                @"and do not manually edit the GOOGLE_APP_ID. You may change your app's bundle "
                @"identifier to '%@'. Or you can download a new configuration file that matches "
                @"your bundle identifier from %@ and replace the current one.",
                kServiceInfoFileName, kServiceInfoFileType, expectedBundleID, kPlistURL);
  };
  return isValid;
}

+ (BOOL)validateAppID:(NSString *)appID {
  // Failing validation only occurs when we are sure we are looking at a V2 app ID and it does not
  // have a valid fingerprint, otherwise we just warn about the potential issue.
  if (!appID.length) {
    return NO;
  }

  NSScanner *stringScanner = [NSScanner scannerWithString:appID];
  stringScanner.charactersToBeSkipped = nil;

  NSString *appIDVersion;
  if (![stringScanner scanCharactersFromSet:[NSCharacterSet decimalDigitCharacterSet]
                                 intoString:&appIDVersion]) {
    return NO;
  }

  if (![stringScanner scanString:@":" intoString:NULL]) {
    // appIDVersion must be separated by ":"
    return NO;
  }

  NSArray *knownVersions = @[ @"1" ];
  if (![knownVersions containsObject:appIDVersion]) {
    // Permit unknown yet properly formatted app ID versions.
    FIRLogInfo(kFIRLoggerCore, @"I-COR000010", @"Unknown GOOGLE_APP_ID version: %@", appIDVersion);
    return YES;
  }

  if (![self validateAppIDFormat:appID withVersion:appIDVersion]) {
    return NO;
  }

  if (![self validateAppIDFingerprint:appID withVersion:appIDVersion]) {
    return NO;
  }

  return YES;
}

+ (NSString *)actualBundleID {
  return [[NSBundle mainBundle] bundleIdentifier];
}

/**
 * Validates that the format of the app ID string is what is expected based on the supplied version.
 * The version must end in ":".
 *
 * For v1 app ids the format is expected to be
 * '<version #>:<project number>:ios:<fingerprint of bundle id>'.
 *
 * This method does not verify that the contents of the app id are correct, just that they fulfill
 * the expected format.
 *
 * @param appID Contents of GOOGLE_APP_ID from the plist file.
 * @param version Indicates what version of the app id format this string should be.
 * @return YES if provided string fufills the expected format, NO otherwise.
 */
+ (BOOL)validateAppIDFormat:(NSString *)appID withVersion:(NSString *)version {
  if (!appID.length || !version.length) {
    return NO;
  }

  NSScanner *stringScanner = [NSScanner scannerWithString:appID];
  stringScanner.charactersToBeSkipped = nil;

  // Skip version part
  // '*<version #>*:<project number>:ios:<fingerprint of bundle id>'
  if (![stringScanner scanString:version intoString:NULL]) {
    // The version part is missing or mismatched
    return NO;
  }

  // Validate version part (see part between '*' symbols below)
  // '<version #>*:*<project number>:ios:<fingerprint of bundle id>'
  if (![stringScanner scanString:@":" intoString:NULL]) {
    // appIDVersion must be separated by ":"
    return NO;
  }

  // Validate version part (see part between '*' symbols below)
  // '<version #>:*<project number>*:ios:<fingerprint of bundle id>'.
  NSInteger projectNumber = NSNotFound;
  if (![stringScanner scanInteger:&projectNumber]) {
    // NO project number found.
    return NO;
  }

  // Validate version part (see part between '*' symbols below)
  // '<version #>:<project number>*:*ios:<fingerprint of bundle id>'.
  if (![stringScanner scanString:@":" intoString:NULL]) {
    // The project number must be separated by ":"
    return NO;
  }

  // Validate version part (see part between '*' symbols below)
  // '<version #>:<project number>:*ios*:<fingerprint of bundle id>'.
  NSString *platform;
  if (![stringScanner scanUpToString:@":" intoString:&platform]) {
    return NO;
  }

  if (![platform isEqualToString:@"ios"]) {
    // The platform must be @"ios"
    return NO;
  }

  // Validate version part (see part between '*' symbols below)
  // '<version #>:<project number>:ios*:*<fingerprint of bundle id>'.
  if (![stringScanner scanString:@":" intoString:NULL]) {
    // The platform must be separated by ":"
    return NO;
  }

  // Validate version part (see part between '*' symbols below)
  // '<version #>:<project number>:ios:*<fingerprint of bundle id>*'.
  unsigned long long fingerprint = NSNotFound;
  if (![stringScanner scanHexLongLong:&fingerprint]) {
    // Fingerprint part is missing
    return NO;
  }

  if (!stringScanner.isAtEnd) {
    // There are not allowed characters in the fingerprint part
    return NO;
  }

  return YES;
}

/**
 * Validates that the fingerprint of the app ID string is what is expected based on the supplied
 * version.
 *
 * Note that the v1 hash algorithm is not permitted on the client and cannot be fully validated.
 *
 * @param appID Contents of GOOGLE_APP_ID from the plist file.
 * @param version Indicates what version of the app id format this string should be.
 * @return YES if provided string fufills the expected fingerprint and the version is known, NO
 *         otherwise.
 */
+ (BOOL)validateAppIDFingerprint:(NSString *)appID withVersion:(NSString *)version {
  // Extract the supplied fingerprint from the supplied app ID.
  // This assumes the app ID format is the same for all known versions below. If the app ID format
  // changes in future versions, the tokenizing of the app ID format will need to take into account
  // the version of the app ID.
  NSArray *components = [appID componentsSeparatedByString:@":"];
  if (components.count != 4) {
    return NO;
  }

  NSString *suppliedFingerprintString = components[3];
  if (!suppliedFingerprintString.length) {
    return NO;
  }

  uint64_t suppliedFingerprint;
  NSScanner *scanner = [NSScanner scannerWithString:suppliedFingerprintString];
  if (![scanner scanHexLongLong:&suppliedFingerprint]) {
    return NO;
  }

  if ([version isEqual:@"1"]) {
    // The v1 hash algorithm is not permitted on the client so the actual hash cannot be validated.
    return YES;
  }

  // Unknown version.
  return NO;
}

- (NSString *)expectedBundleID {
  return _options.bundleID;
}

// end App ID validation

#pragma mark - Reading From Plist & User Defaults

/**
 * Clears the data collection switch from the standard NSUserDefaults for easier testing and
 * readability.
 */
- (void)clearDataCollectionSwitchFromUserDefaults {
  NSString *key =
      [NSString stringWithFormat:kFIRGlobalAppDataCollectionEnabledDefaultsKeyFormat, self.name];
  [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
}

/**
 * Reads the data collection switch from the standard NSUserDefaults for easier testing and
 * readability.
 */
+ (nullable NSNumber *)readDataCollectionSwitchFromUserDefaultsForApp:(FIRApp *)app {
  // Read the object in user defaults, and only return if it's an NSNumber.
  NSString *key =
      [NSString stringWithFormat:kFIRGlobalAppDataCollectionEnabledDefaultsKeyFormat, app.name];
  id collectionEnabledDefaultsObject = [[NSUserDefaults standardUserDefaults] objectForKey:key];
  if ([collectionEnabledDefaultsObject isKindOfClass:[NSNumber class]]) {
    return collectionEnabledDefaultsObject;
  }

  return nil;
}

/**
 * Reads the data collection switch from the Info.plist for easier testing and readability. Will
 * only read once from the plist and return the cached value.
 */
+ (nullable NSNumber *)readDataCollectionSwitchFromPlist {
  static NSNumber *collectionEnabledPlistObject;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // Read the data from the `Info.plist`, only assign it if it's there and an NSNumber.
    id plistValue = [[NSBundle mainBundle]
        objectForInfoDictionaryKey:kFIRGlobalAppDataCollectionEnabledPlistKey];
    if (plistValue && [plistValue isKindOfClass:[NSNumber class]]) {
      collectionEnabledPlistObject = (NSNumber *)plistValue;
    }
  });

  return collectionEnabledPlistObject;
}

#pragma mark - Sending Logs

- (void)sendLogsWithServiceName:(NSString *)serviceName
                        version:(NSString *)version
                          error:(NSError *)error {
  // If the user has manually turned off data collection, return and don't send logs.
  if (![self isDataCollectionDefaultEnabled]) {
    return;
  }

  NSMutableDictionary *userInfo = [[NSMutableDictionary alloc] initWithDictionary:@{
    kFIRAppDiagnosticsConfigurationTypeKey : @(FIRConfigTypeSDK),
    kFIRAppDiagnosticsSDKNameKey : serviceName,
    kFIRAppDiagnosticsSDKVersionKey : version,
    kFIRAppDiagnosticsFIRAppKey : self
  }];
  if (error) {
    userInfo[kFIRAppDiagnosticsErrorKey] = error;
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:kFIRAppDiagnosticsNotification
                                                      object:nil
                                                    userInfo:userInfo];
}

@end

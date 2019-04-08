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

#import "FIRApp.h"
#import "FIRErrors.h"

@class FIRComponentContainer;
@protocol FIRLibrary;

/**
 * The internal interface to FIRApp. This is meant for first-party integrators, who need to receive
 * FIRApp notifications, log info about the success or failure of their configuration, and access
 * other internal functionality of FIRApp.
 *
 * TODO(b/28296561): Restructure this header.
 */
NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, FIRConfigType) {
  FIRConfigTypeCore = 1,
  FIRConfigTypeSDK = 2,
};

/**
 * Names of services provided by Firebase.
 */
extern NSString *const kFIRServiceAdMob;
extern NSString *const kFIRServiceAuth;
extern NSString *const kFIRServiceAuthUI;
extern NSString *const kFIRServiceCrash;
extern NSString *const kFIRServiceDatabase;
extern NSString *const kFIRServiceDynamicLinks;
extern NSString *const kFIRServiceInstanceID;
extern NSString *const kFIRServiceInvites;
extern NSString *const kFIRServiceMessaging;
extern NSString *const kFIRServiceMeasurement;
extern NSString *const kFIRServiceRemoteConfig;
extern NSString *const kFIRServiceStorage;

/**
 * Names of services provided by the Google pod, but logged by the Firebase pod.
 */
extern NSString *const kGGLServiceAnalytics;
extern NSString *const kGGLServiceSignIn;

extern NSString *const kFIRDefaultAppName;
extern NSString *const kFIRAppReadyToConfigureSDKNotification;
extern NSString *const kFIRAppDeleteNotification;
extern NSString *const kFIRAppIsDefaultAppKey;
extern NSString *const kFIRAppNameKey;
extern NSString *const kFIRGoogleAppIDKey;

/**
 * The format string for the User Defaults key used for storing the data collection enabled flag.
 * This includes formatting to append the Firebase App's name.
 */
extern NSString *const kFIRGlobalAppDataCollectionEnabledDefaultsKeyFormat;

/**
 * The plist key used for storing the data collection enabled flag.
 */
extern NSString *const kFIRGlobalAppDataCollectionEnabledPlistKey;

/**
 * A notification fired containing diagnostic information when SDK errors occur.
 */
extern NSString *const kFIRAppDiagnosticsNotification;

/** @var FIRAuthStateDidChangeInternalNotification
 @brief The name of the @c NSNotificationCenter notification which is posted when the auth state
 changes (e.g. a new token has been produced, a user logs in or out). The object parameter of
 the notification is a dictionary possibly containing the key:
 @c FIRAuthStateDidChangeInternalNotificationTokenKey (the new access token.) If it does not
 contain this key it indicates a sign-out event took place.
 */
extern NSString *const FIRAuthStateDidChangeInternalNotification;

/** @var FIRAuthStateDidChangeInternalNotificationTokenKey
 @brief A key present in the dictionary object parameter of the
 @c FIRAuthStateDidChangeInternalNotification notification. The value associated with this
 key will contain the new access token.
 */
extern NSString *const FIRAuthStateDidChangeInternalNotificationTokenKey;

/** @var FIRAuthStateDidChangeInternalNotificationAppKey
 @brief A key present in the dictionary object parameter of the
 @c FIRAuthStateDidChangeInternalNotification notification. The value associated with this
 key will contain the FIRApp associated with the auth instance.
 */
extern NSString *const FIRAuthStateDidChangeInternalNotificationAppKey;

/** @var FIRAuthStateDidChangeInternalNotificationUIDKey
 @brief A key present in the dictionary object parameter of the
 @c FIRAuthStateDidChangeInternalNotification notification. The value associated with this
 key will contain the new user's UID (or nil if there is no longer a user signed in).
 */
extern NSString *const FIRAuthStateDidChangeInternalNotificationUIDKey;

@interface FIRApp ()

/**
 * A flag indicating if this is the default app (has the default app name).
 */
@property(nonatomic, readonly) BOOL isDefaultApp;

/*
 * The container of interop SDKs for this app.
 */
@property(nonatomic) FIRComponentContainer *container;

/**
 * Creates an error for failing to configure a subspec service. This method is called by each
 * FIRApp notification listener.
 */
+ (NSError *)errorForSubspecConfigurationFailureWithDomain:(NSString *)domain
                                                 errorCode:(FIRErrorCode)code
                                                   service:(NSString *)service
                                                    reason:(NSString *)reason;
/**
 * Checks if the default app is configured without trying to configure it.
 */
+ (BOOL)isDefaultAppConfigured;

/**
 * Registers a given third-party library with the given version number to be reported for
 * analytics.
 *
 * @param name Name of the library.
 * @param version Version of the library.
 */
+ (void)registerLibrary:(nonnull NSString *)name withVersion:(nonnull NSString *)version;

/**
 * Registers a given internal library with the given version number to be reported for
 * analytics.
 *
 * @param library Optional parameter for component registration.
 * @param name Name of the library.
 * @param version Version of the library.
 */
+ (void)registerInternalLibrary:(nonnull Class<FIRLibrary>)library
                       withName:(nonnull NSString *)name
                    withVersion:(nonnull NSString *)version;

/**
 * A concatenated string representing all the third-party libraries and version numbers.
 */
+ (NSString *)firebaseUserAgent;

/**
 * Used by each SDK to send logs about SDK configuration status to Clearcut.
 */
- (void)sendLogsWithServiceName:(NSString *)serviceName
                        version:(NSString *)version
                          error:(NSError *)error;

/**
 * Can be used by the unit tests in eack SDK to reset FIRApp. This method is thread unsafe.
 */
+ (void)resetApps;

/**
 * Can be used by the unit tests in each SDK to set customized options.
 */
- (instancetype)initInstanceWithName:(NSString *)name options:(FIROptions *)options;

@end

NS_ASSUME_NONNULL_END

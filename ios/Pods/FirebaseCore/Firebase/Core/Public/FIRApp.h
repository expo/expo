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

#import <Foundation/Foundation.h>

@class FIROptions;

NS_ASSUME_NONNULL_BEGIN

/** A block that takes a BOOL and has no return value. */
typedef void (^FIRAppVoidBoolCallback)(BOOL success) NS_SWIFT_NAME(FirebaseAppVoidBoolCallback);

/**
 * The entry point of Firebase SDKs.
 *
 * Initialize and configure FIRApp using +[FIRApp configure]
 * or other customized ways as shown below.
 *
 * The logging system has two modes: default mode and debug mode. In default mode, only logs with
 * log level Notice, Warning and Error will be sent to device. In debug mode, all logs will be sent
 * to device. The log levels that Firebase uses are consistent with the ASL log levels.
 *
 * Enable debug mode by passing the -FIRDebugEnabled argument to the application. You can add this
 * argument in the application's Xcode scheme. When debug mode is enabled via -FIRDebugEnabled,
 * further executions of the application will also be in debug mode. In order to return to default
 * mode, you must explicitly disable the debug mode with the application argument -FIRDebugDisabled.
 *
 * It is also possible to change the default logging level in code by calling setLoggerLevel: on
 * the FIRConfiguration interface.
 */
NS_SWIFT_NAME(FirebaseApp)
@interface FIRApp : NSObject

/**
 * Configures a default Firebase app. Raises an exception if any configuration step fails. The
 * default app is named "__FIRAPP_DEFAULT". This method should be called after the app is launched
 * and before using Firebase services. This method is thread safe and contains synchronous file I/O
 * (reading GoogleService-Info.plist from disk).
 */
+ (void)configure;

/**
 * Configures the default Firebase app with the provided options. The default app is named
 * "__FIRAPP_DEFAULT". Raises an exception if any configuration step fails. This method is thread
 * safe.
 *
 * @param options The Firebase application options used to configure the service.
 */
+ (void)configureWithOptions:(FIROptions *)options NS_SWIFT_NAME(configure(options:));

/**
 * Configures a Firebase app with the given name and options. Raises an exception if any
 * configuration step fails. This method is thread safe.
 *
 * @param name The application's name given by the developer. The name should should only contain
               Letters, Numbers and Underscore.
 * @param options The Firebase application options used to configure the services.
 */
// clang-format off
+ (void)configureWithName:(NSString *)name
                  options:(FIROptions *)options NS_SWIFT_NAME(configure(name:options:));
// clang-format on

/**
 * Returns the default app, or nil if the default app does not exist.
 */
+ (nullable FIRApp *)defaultApp NS_SWIFT_NAME(app());

/**
 * Returns a previously created FIRApp instance with the given name, or nil if no such app exists.
 * This method is thread safe.
 */
+ (nullable FIRApp *)appNamed:(NSString *)name NS_SWIFT_NAME(app(name:));

/**
 * Returns the set of all extant FIRApp instances, or nil if there are no FIRApp instances. This
 * method is thread safe.
 */
@property(class, readonly, nullable) NSDictionary<NSString *, FIRApp *> *allApps;

/**
 * Cleans up the current FIRApp, freeing associated data and returning its name to the pool for
 * future use. This method is thread safe.
 */
- (void)deleteApp:(FIRAppVoidBoolCallback)completion;

/**
 * FIRApp instances should not be initialized directly. Call +[FIRApp configure],
 * +[FIRApp configureWithOptions:], or +[FIRApp configureWithNames:options:] directly.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 * Gets the name of this app.
 */
@property(nonatomic, copy, readonly) NSString *name;

/**
 * Gets a copy of the options for this app. These are non-modifiable.
 */
@property(nonatomic, copy, readonly) FIROptions *options;

@end

NS_ASSUME_NONNULL_END

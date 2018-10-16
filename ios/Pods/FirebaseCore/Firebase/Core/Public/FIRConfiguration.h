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

#import "FIRAnalyticsConfiguration.h"
#import "FIRLoggerLevel.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * This interface provides global level properties that the developer can tweak, and the singleton
 * of the Firebase Analytics configuration class.
 */
NS_SWIFT_NAME(FirebaseConfiguration)
@interface FIRConfiguration : NSObject

/** Returns the shared configuration object. */
@property(class, nonatomic, readonly) FIRConfiguration *sharedInstance NS_SWIFT_NAME(shared);

/** The configuration class for Firebase Analytics. */
@property(nonatomic, readwrite) FIRAnalyticsConfiguration *analyticsConfiguration;

/**
 * Sets the logging level for internal Firebase logging. Firebase will only log messages
 * that are logged at or below loggerLevel. The messages are logged both to the Xcode
 * console and to the device's log. Note that if an app is running from AppStore, it will
 * never log above FIRLoggerLevelNotice even if loggerLevel is set to a higher (more verbose)
 * setting.
 *
 * @param loggerLevel The maximum logging level. The default level is set to FIRLoggerLevelNotice.
 */
- (void)setLoggerLevel:(FIRLoggerLevel)loggerLevel;

@end

NS_ASSUME_NONNULL_END

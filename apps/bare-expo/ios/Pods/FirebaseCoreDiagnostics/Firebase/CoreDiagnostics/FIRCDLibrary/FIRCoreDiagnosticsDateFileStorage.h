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

NS_ASSUME_NONNULL_BEGIN

/// Stores a date to a specified file.
@interface FIRCoreDiagnosticsDateFileStorage : NSObject

- (instancetype)init NS_UNAVAILABLE;

/**
 * Default initializer.
 * @param fileURL The URL of the file to store the date. The directory must exist, the file may not
 * exist, it will be created if needed.
 */
- (instancetype)initWithFileURL:(NSURL *)fileURL;

/**
 * Saves the date to the specified file.
 * @return YES on success, NO otherwise.
 */
- (BOOL)setDate:(nullable NSDate *)date error:(NSError **)outError;

/**
 * Reads the date to the specified file.
 * @return Returns date if exists, otherwise `nil`.
 */
- (nullable NSDate *)date;

@end

NS_ASSUME_NONNULL_END

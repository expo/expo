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

/**
 * This class provides utilities for accessing resources in bundles.
 */
@interface FIRBundleUtil : NSObject

/**
 * Finds all relevant bundles, starting with [NSBundle mainBundle].
 */
+ (NSArray *)relevantBundles;

/**
 * Reads the options dictionary from one of the provided bundles.
 *
 * @param resourceName The resource name, e.g. @"GoogleService-Info".
 * @param fileType The file type (extension), e.g. @"plist".
 * @param bundles The bundles to expect, in priority order. See also
 * +[FIRBundleUtil relevantBundles].
 */
+ (NSString *)optionsDictionaryPathWithResourceName:(NSString *)resourceName
                                        andFileType:(NSString *)fileType
                                          inBundles:(NSArray *)bundles;

/**
 * Finds URL schemes defined in all relevant bundles, starting with those from
 * [NSBundle mainBundle].
 */
+ (NSArray *)relevantURLSchemes;

/**
 * Checks if the bundle identifier exists in the given bundles.
 */
+ (BOOL)hasBundleIdentifier:(NSString *)bundleIdentifier inBundles:(NSArray *)bundles;

@end

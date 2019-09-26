// Copyright 2018 Google
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

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// A thread-safe user defaults that uses C functions from CFPreferences.h instead of
/// `NSUserDefaults`. This is to avoid sending an `NSNotification` when it's changed from a
/// background thread to avoid crashing. // TODO: Insert radar number here.
@interface GULUserDefaults : NSObject

/// A shared user defaults similar to +[NSUserDefaults standardUserDefaults] and accesses the same
/// data of the standardUserDefaults.
+ (GULUserDefaults *)standardUserDefaults;

/// Initializes preferences with a suite name that is the same with the NSUserDefaults' suite name.
/// Both of CFPreferences and NSUserDefaults share the same plist file so their data will exactly
/// the same.
///
/// @param suiteName The name of the suite of the user defaults.
- (instancetype)initWithSuiteName:(nullable NSString *)suiteName;

#pragma mark - Getters

/// Searches the receiver's search list for a default with the key 'defaultName' and return it. If
/// another process has changed defaults in the search list, NSUserDefaults will automatically
/// update to the latest values. If the key in question has been marked as ubiquitous via a Defaults
/// Configuration File, the latest value may not be immediately available, and the registered value
/// will be returned instead.
- (nullable id)objectForKey:(NSString *)defaultName;

/// Equivalent to -objectForKey:, except that it will return nil if the value is not an NSArray.
- (nullable NSArray *)arrayForKey:(NSString *)defaultName;

/// Equivalent to -objectForKey:, except that it will return nil if the value
/// is not an NSDictionary.
- (nullable NSDictionary<NSString *, id> *)dictionaryForKey:(NSString *)defaultName;

/// Equivalent to -objectForKey:, except that it will convert NSNumber values to their NSString
/// representation. If a non-string non-number value is found, nil will be returned.
- (nullable NSString *)stringForKey:(NSString *)defaultName;

/// Equivalent to -objectForKey:, except that it converts the returned value to an NSInteger. If the
/// value is an NSNumber, the result of -integerValue will be returned. If the value is an NSString,
/// it will be converted to NSInteger if possible. If the value is a boolean, it will be converted
/// to either 1 for YES or 0 for NO. If the value is absent or can't be converted to an integer, 0
/// will be returned.
- (NSInteger)integerForKey:(NSString *)defaultName;

/// Similar to -integerForKey:, except that it returns a float, and boolean values will not be
/// converted.
- (float)floatForKey:(NSString *)defaultName;

/// Similar to -integerForKey:, except that it returns a double, and boolean values will not be
/// converted.
- (double)doubleForKey:(NSString *)defaultName;

/// Equivalent to -objectForKey:, except that it converts the returned value to a BOOL. If the value
/// is an NSNumber, NO will be returned if the value is 0, YES otherwise. If the value is an
/// NSString, values of "YES" or "1" will return YES, and values of "NO", "0", or any other string
/// will return NO. If the value is absent or can't be converted to a BOOL, NO will be returned.
- (BOOL)boolForKey:(NSString *)defaultName;

#pragma mark - Setters

/// Immediately stores a value (or removes the value if `nil` is passed as the value) for the
/// provided key in the search list entry for the receiver's suite name in the current user and any
/// host, then asynchronously stores the value persistently, where it is made available to other
/// processes.
- (void)setObject:(nullable id)value forKey:(NSString *)defaultName;

/// Equivalent to -setObject:forKey: except that the value is converted from a float to an NSNumber.
- (void)setFloat:(float)value forKey:(NSString *)defaultName;

/// Equivalent to -setObject:forKey: except that the value is converted from a double to an
/// NSNumber.
- (void)setDouble:(double)value forKey:(NSString *)defaultName;

/// Equivalent to -setObject:forKey: except that the value is converted from an NSInteger to an
/// NSNumber.
- (void)setInteger:(NSInteger)value forKey:(NSString *)defaultName;

/// Equivalent to -setObject:forKey: except that the value is converted from a BOOL to an NSNumber.
- (void)setBool:(BOOL)value forKey:(NSString *)defaultName;

#pragma mark - Removing Defaults

/// Equivalent to -[... setObject:nil forKey:defaultName]
- (void)removeObjectForKey:(NSString *)defaultName;

#pragma mark - Save data

/// Blocks the calling thread until all in-progress set operations have completed.
- (void)synchronize;

@end

NS_ASSUME_NONNULL_END

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

/// A mutable dictionary that provides atomic accessor and mutators.
@interface GULMutableDictionary : NSObject

/// Returns an object given a key in the dictionary or nil if not found.
- (id)objectForKey:(id)key;

/// Updates the object given its key or adds it to the dictionary if it is not in the dictionary.
- (void)setObject:(id)object forKey:(id<NSCopying>)key;

/// Removes the object given its session ID from the dictionary.
- (void)removeObjectForKey:(id)key;

/// Removes all objects.
- (void)removeAllObjects;

/// Returns the number of current objects in the dictionary.
- (NSUInteger)count;

/// Returns an object given a key in the dictionary or nil if not found.
- (id)objectForKeyedSubscript:(id<NSCopying>)key;

/// Updates the object given its key or adds it to the dictionary if it is not in the dictionary.
- (void)setObject:(id)obj forKeyedSubscript:(id<NSCopying>)key;

/// Returns the immutable dictionary.
- (NSDictionary *)dictionary;

@end

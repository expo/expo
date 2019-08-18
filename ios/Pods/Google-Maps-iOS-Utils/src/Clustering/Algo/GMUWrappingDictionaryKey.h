/* Copyright (c) 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

/**
 * Wraps an object which does not implement NSCopying to be used as NSDictionary keys.
 * This class will forward -hash and -isEqual methods to the underlying object.
 */
@interface GMUWrappingDictionaryKey : NSObject<NSCopying>

- (instancetype)initWithObject:(id)object;

@end

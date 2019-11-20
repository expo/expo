/* Copyright (c) 2011 Google Inc.
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

#import "GTLRDefines.h"

@protocol GTLRObjectClassResolver;

NS_ASSUME_NONNULL_BEGIN

// This protocol and support class are an internal implementation detail so
// GTLRObject and GTLRQuery can share some code.

/**
 *  An internal protocol for the GTLR library.
 *
 *  None of these methods should be used by client apps.
 */
@protocol GTLRRuntimeCommon <NSObject>
@required
// Get/Set properties
- (void)setJSONValue:(nullable id)obj forKey:(NSString *)key;
- (id)JSONValueForKey:(NSString *)key;
// Child cache
- (void)setCacheChild:(nullable id)obj forKey:(NSString *)key;
- (nullable id)cacheChildForKey:(NSString *)key;
// Object mapper.
- (nullable id<GTLRObjectClassResolver>)objectClassResolver;
// Key map
+ (nullable NSDictionary<NSString *, NSString *> *)propertyToJSONKeyMapForClass:(Class<GTLRRuntimeCommon>)aClass;
// Array item types
+ (nullable NSDictionary<NSString *, Class> *)arrayPropertyToClassMapForClass:(Class<GTLRRuntimeCommon>)aClass;
// The parent class for dynamic support
+ (nullable Class<GTLRRuntimeCommon>)ancestorClass;
@end

/**
 *  An internal class for the GTLR library.
 *
 *  None of these methods should be used by client apps.
 */
@interface GTLRRuntimeCommon : NSObject
// Wire things up.
+ (BOOL)resolveInstanceMethod:(SEL)sel onClass:(Class)onClass;
// Helpers
+ (nullable id)objectFromJSON:(id)json
                 defaultClass:(nullable Class)defaultClass
          objectClassResolver:(id<GTLRObjectClassResolver>)objectClassResolver
                  isCacheable:(nullable BOOL *)isCacheable;
+ (nullable id)jsonFromAPIObject:(id)obj
                   expectedClass:(nullable Class)expectedClass
                     isCacheable:(nullable BOOL *)isCacheable;
// Walk up the class tree merging dictionaries and return the result.
+ (NSDictionary *)mergedClassDictionaryForSelector:(SEL)selector
                                        startClass:(Class)startClass
                                     ancestorClass:(Class)ancestorClass
                                             cache:(NSMutableDictionary *)cache;
@end

NS_ASSUME_NONNULL_END

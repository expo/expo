// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKJSONValue.h"

#import <Foundation/Foundation.h>

#import "FBSDKBasicUtility.h"
#import "FBSDKSafeCast.h"
#import "FBSDKTypeUtility.h"

@interface FBSDKJSONField ()
- (instancetype)initWithPotentialJSONField:(id)obj;
@end

static NSArray<FBSDKJSONField *> *createArray(id obj)
{
  NSArray *const original = FBSDK_CAST_TO_CLASS_OR_NIL(obj, NSArray);
  if (!original) {
    return @[];
  }

  NSMutableArray<FBSDKJSONField *> *const fields =
  [[NSMutableArray alloc] initWithCapacity:original.count];

  for (id field in original) {
    FBSDKJSONField *const f = [[FBSDKJSONField alloc] initWithPotentialJSONField:field];
    if (f) {
      [fields addObject:f];
    }
  }

  return fields;
}

static NSDictionary<NSString *, FBSDKJSONField *> *createDictionary(id obj)
{
  NSDictionary *const original = FBSDK_CAST_TO_CLASS_OR_NIL(obj, NSDictionary);
  if (!original) {
    return @{};
  }

  NSMutableDictionary<NSString *, FBSDKJSONField *> *const fields =
  [[NSMutableDictionary alloc] initWithCapacity:original.count];

  for (id key in original) {
    // This is just a sanity check. Apple should only give us string keys
    // anyway.
    if (![key respondsToSelector:@selector(isKindOfClass:)] || ![key isKindOfClass:NSString.class]) {
      continue;
    }
    NSString *const stringKey = (NSString *)key;

    FBSDKJSONField *const typedField = [[FBSDKJSONField alloc] initWithPotentialJSONField:original[key]];
    if (typedField) {
      fields[stringKey] = typedField;
    }
  }

  return fields;
}

@implementation FBSDKJSONValue

- (instancetype)initWithPotentialJSONObject:(id)obj
{
  // If this isn't a real JSON object, dump it.
  if (![FBSDKTypeUtility isValidJSONObject:obj]) {
    return nil;
  }
  _rawObject = obj;

  return self;
}

- (void)matchArray:(void (^)(NSArray<FBSDKJSONField *> *))arrayMatcher
        dictionary:(void (^)(NSDictionary<NSString *, FBSDKJSONField *> *))dictMatcher
{
  if (arrayMatcher && [_rawObject isKindOfClass:[NSArray class]]) {
    arrayMatcher(createArray(_rawObject));
  } else if (dictMatcher && [_rawObject isKindOfClass:[NSDictionary class]]) {
    dictMatcher(createDictionary(_rawObject));
  }
}

- (NSDictionary<NSString *, FBSDKJSONField *> *_Nullable)matchDictionaryOrNil
{
  __block NSDictionary<NSString *, FBSDKJSONField *> *result = nil;
  [self matchArray:nil dictionary:^(NSDictionary<NSString *, FBSDKJSONField *> *_Nonnull value) {
    result = value;
  }];
  return result;
}

- (NSDictionary<NSString *, id> *_Nullable)unsafe_matchDictionaryOrNil
{
  return [_rawObject isKindOfClass:NSDictionary.class] ? _rawObject : nil;
}

- (NSArray<FBSDKJSONField *> *_Nullable)matchArrayOrNil
{
  __block NSArray<FBSDKJSONField *> *result = nil;
  [self matchArray:^(NSArray<FBSDKJSONField *> *_Nonnull value) {
          result = value;
        } dictionary:nil];
  return result;
}

- (NSArray *_Nullable)unsafe_matchArrayOrNil
{
  __block BOOL isArray = NO;
  [self matchArray:^(NSArray<FBSDKJSONField *> *_Nonnull _) {
          isArray = YES;
        } dictionary:nil];

  return [_rawObject isKindOfClass:NSArray.class] ? _rawObject : nil;
}

@end

@implementation FBSDKJSONField

- (instancetype)initWithPotentialJSONField:(id)obj
{
  // If this is nil, don't wrap it.
  if (obj == nil) {
    return nil;
  }

  // Per Apple's Docs, these are the only types FBSDKTypeUtility can return.
  if (
    ![obj isKindOfClass:NSString.class]
    && ![obj isKindOfClass:NSNumber.class]
    && ![obj isKindOfClass:NSNull.class]
    && ![obj isKindOfClass:NSDictionary.class]
    && ![obj isKindOfClass:NSArray.class]) {
    return nil;
  }

  if (self = [super init]) {
    _rawObject = obj;
  }

  return self;
}

- (void)matchArray:(void (^)(NSArray<FBSDKJSONField *> *))arrayMatcher
        dictionary:(void (^)(NSDictionary<NSString *, FBSDKJSONField *> *_Nonnull))dictionaryMatcher
            string:(void (^)(NSString *_Nonnull))stringMatcher
            number:(void (^)(NSNumber *_Nonnull))numberMatcher
              null:(void (^)(void))nullMatcher
{
  if (nullMatcher && [_rawObject isKindOfClass:NSNull.class]) {
    nullMatcher();
  } else if (numberMatcher && [_rawObject isKindOfClass:NSNumber.class]) {
    numberMatcher(_rawObject);
  } else if (stringMatcher && [_rawObject isKindOfClass:NSString.class]) {
    stringMatcher(_rawObject);
  } else if (arrayMatcher && [_rawObject isKindOfClass:NSArray.class]) {
    arrayMatcher(createArray(_rawObject));
  } else if (dictionaryMatcher && [_rawObject isKindOfClass:NSDictionary.class]) {
    dictionaryMatcher(createDictionary(_rawObject));
  }
}

- (NSArray<FBSDKJSONField *> *_Nullable)arrayOrNil
{
  __block NSArray<FBSDKJSONField *> *result = nil;
  [self matchArray:^(NSArray<FBSDKJSONField *> *_Nonnull a) {
          result = [a copy];
        } dictionary:nil string:nil number:nil null:nil];
  return result;
}

- (NSDictionary<NSString *, FBSDKJSONField *> *_Nullable)dictionaryOrNil
{
  __block NSDictionary<NSString *, FBSDKJSONField *> *result = nil;
  [self matchArray:nil dictionary:^(NSDictionary<NSString *, FBSDKJSONField *> *_Nonnull d) {
                         result = [d copy];
                       } string:nil number:nil null:nil];
  return result;
}

- (NSString *_Nullable)stringOrNil
{
  __block NSString *result = nil;
  [self matchArray:nil dictionary:nil string:^(NSString *_Nonnull s) {
                                        result = [s copy];
                                      } number:nil null:nil];
  return result;
}

- (NSNumber *_Nullable)numberOrNil
{
  __block NSNumber *result = nil;
  [self matchArray:nil dictionary:nil string:nil number:^(NSNumber *_Nonnull n) {
                                                   result = n;
                                                 } null:nil];
  return result;
}

- (NSNull *_Nullable)nullOrNil
{
  __block NSNull *result = nil;
  [self matchArray:nil dictionary:nil string:nil number:nil null:^{
    result = [NSNull null];
  }];
  return result;
}

@end

FBSDKJSONValue *_Nullable FBSDKCreateJSONFromString(NSString *_Nullable string, NSError *__autoreleasing *errorRef)
{
  return
  [[FBSDKJSONValue alloc] initWithPotentialJSONObject:[FBSDKBasicUtility objectForJSONString:string error:errorRef]];
}

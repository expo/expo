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

#import "FBSDKUserDataStore.h"
#import "FBSDKUserDataStore+Internal.h"

#import "FBSDKBasicUtility.h"
#import "FBSDKTypeUtility.h"

static NSString *const FBSDKUserDataKey = @"com.facebook.appevents.UserDataStore.userData";
static NSString *const FBSDKInternalUserDataKey = @"com.facebook.appevents.UserDataStore.internalUserData";

static NSMutableDictionary<NSString *, NSString *> *hashedUserData;
static NSMutableDictionary<NSString *, NSString *> *internalHashedUserData;
static NSMutableSet<NSString *> *enabledRules;

static dispatch_queue_t serialQueue;

//
// Public event user data types
//

FBSDKAppEventUserDataType FBSDKAppEventEmail = @"em";
FBSDKAppEventUserDataType FBSDKAppEventFirstName = @"fn";
FBSDKAppEventUserDataType FBSDKAppEventLastName = @"ln";
FBSDKAppEventUserDataType FBSDKAppEventPhone = @"ph";
FBSDKAppEventUserDataType FBSDKAppEventDateOfBirth = @"dob";
FBSDKAppEventUserDataType FBSDKAppEventGender = @"ge";
FBSDKAppEventUserDataType FBSDKAppEventCity = @"ct";
FBSDKAppEventUserDataType FBSDKAppEventState = @"st";
FBSDKAppEventUserDataType FBSDKAppEventZip = @"zp";
FBSDKAppEventUserDataType FBSDKAppEventCountry = @"country";

@implementation FBSDKUserDataStore

+ (void)initialize
{
  serialQueue = dispatch_queue_create("com.facebook.appevents.UserDataStore", DISPATCH_QUEUE_SERIAL);
  hashedUserData = [FBSDKUserDataStore initializeUserData:FBSDKUserDataKey];
  internalHashedUserData = [FBSDKUserDataStore initializeUserData:FBSDKInternalUserDataKey];
  enabledRules = [[NSMutableSet alloc] init];
}

+ (void)setUserEmail:(nullable NSString *)email
           firstName:(nullable NSString *)firstName
            lastName:(nullable NSString *)lastName
               phone:(nullable NSString *)phone
         dateOfBirth:(nullable NSString *)dateOfBirth
              gender:(nullable NSString *)gender
                city:(nullable NSString *)city
               state:(nullable NSString *)state
                 zip:(nullable NSString *)zip
             country:(nullable NSString *)country
{
  NSMutableDictionary *ud = [[NSMutableDictionary alloc] init];
  if (email) {
    [FBSDKTypeUtility dictionary:ud setObject:[FBSDKUserDataStore encryptData:email type:FBSDKAppEventEmail] forKey:FBSDKAppEventEmail];
  }
  if (firstName) {
    [FBSDKTypeUtility dictionary:ud setObject:[FBSDKUserDataStore encryptData:firstName type:FBSDKAppEventFirstName] forKey:FBSDKAppEventFirstName];
  }
  if (lastName) {
    [FBSDKTypeUtility dictionary:ud setObject:[FBSDKUserDataStore encryptData:lastName type:FBSDKAppEventLastName] forKey:FBSDKAppEventLastName];
  }
  if (phone) {
    [FBSDKTypeUtility dictionary:ud setObject:[FBSDKUserDataStore encryptData:phone type:FBSDKAppEventPhone] forKey:FBSDKAppEventPhone];
  }
  if (dateOfBirth) {
    [FBSDKTypeUtility dictionary:ud setObject:[FBSDKUserDataStore encryptData:dateOfBirth type:FBSDKAppEventDateOfBirth] forKey:FBSDKAppEventDateOfBirth];
  }
  if (gender) {
    [FBSDKTypeUtility dictionary:ud setObject:[FBSDKUserDataStore encryptData:gender type:FBSDKAppEventGender] forKey:FBSDKAppEventGender];
  }
  if (city) {
    [FBSDKTypeUtility dictionary:ud setObject:[FBSDKUserDataStore encryptData:city type:FBSDKAppEventCity] forKey:FBSDKAppEventCity];
  }
  if (state) {
    [FBSDKTypeUtility dictionary:ud setObject:[FBSDKUserDataStore encryptData:state type:FBSDKAppEventState] forKey:FBSDKAppEventState];
  }
  if (zip) {
    [FBSDKTypeUtility dictionary:ud setObject:[FBSDKUserDataStore encryptData:zip type:FBSDKAppEventZip] forKey:FBSDKAppEventZip];
  }
  if (country) {
    [FBSDKTypeUtility dictionary:ud setObject:[FBSDKUserDataStore encryptData:country type:FBSDKAppEventCountry] forKey:FBSDKAppEventCountry];
  }

  dispatch_async(serialQueue, ^{
    hashedUserData = [ud mutableCopy];
    [[NSUserDefaults standardUserDefaults] setObject:[FBSDKUserDataStore stringByHashedData:hashedUserData]
                                              forKey:FBSDKUserDataKey];
  });
}

+ (void)setUserData:(nullable NSString *)data
            forType:(FBSDKAppEventUserDataType)type
{
  [FBSDKUserDataStore setHashData:[FBSDKUserDataStore encryptData:data type:type]
                          forType:type];
}

+ (void)setHashData:(nullable NSString *)hashData
            forType:(FBSDKAppEventUserDataType)type
{
  dispatch_async(serialQueue, ^{
    if (!hashData) {
      [hashedUserData removeObjectForKey:type];
    } else {
      [FBSDKTypeUtility dictionary:hashedUserData setObject:hashData forKey:type];
    }
    [[NSUserDefaults standardUserDefaults] setObject:[FBSDKUserDataStore stringByHashedData:hashedUserData]
                                              forKey:FBSDKUserDataKey];
  });
}

+ (void)setInternalHashData:(nullable NSString *)hashData
                    forType:(FBSDKAppEventUserDataType)type
{
  dispatch_async(serialQueue, ^{
    if (!hashData) {
      [internalHashedUserData removeObjectForKey:type];
    } else {
      internalHashedUserData[type] = hashData;
    }
    [[NSUserDefaults standardUserDefaults] setObject:[FBSDKUserDataStore stringByHashedData:internalHashedUserData]
                                              forKey:FBSDKInternalUserDataKey];
  });
}

+ (void)setEnabledRules:(NSArray<NSString *> *)rules
{
  if (rules.count > 0) {
    [enabledRules addObjectsFromArray:rules];
  }
}

+ (void)clearUserDataForType:(FBSDKAppEventUserDataType)type
{
  [FBSDKUserDataStore setUserData:nil forType:type];
}

+ (NSString *)getUserData
{
  return [FBSDKUserDataStore getHashedData];
}

+ (NSString *)getHashedData
{
  __block NSString *hashedUserDataString;
  dispatch_sync(serialQueue, ^{
    NSMutableDictionary<NSString *, NSString *> *hashedUD = [[NSMutableDictionary alloc] init];
    [hashedUD addEntriesFromDictionary:hashedUserData];
    for (NSString *key in enabledRules) {
      if (internalHashedUserData[key]) {
        hashedUD[key] = internalHashedUserData[key];
      }
    }
    hashedUserDataString = [FBSDKUserDataStore stringByHashedData:hashedUD];
  });
  return hashedUserDataString;
}

+ (void)clearUserData
{
  [FBSDKUserDataStore setUserEmail:nil
                         firstName:nil
                          lastName:nil
                             phone:nil
                       dateOfBirth:nil
                            gender:nil
                              city:nil
                             state:nil
                               zip:nil
                           country:nil];
}

+ (NSString *)getInternalHashedDataForType:(FBSDKAppEventUserDataType)type
{
  __block NSString *hashedData;
  dispatch_sync(serialQueue, ^{
    hashedData = [FBSDKTypeUtility dictionary:internalHashedUserData objectForKey:type ofType:NSObject.class];
  });
  return hashedData;
}

#pragma mark - Helper Methods

+ (NSMutableDictionary<NSString *, NSString *> *)initializeUserData:(NSString *)userDataKey
{
  NSString *userData = [[NSUserDefaults standardUserDefaults] stringForKey:userDataKey];
  NSMutableDictionary<NSString *, NSString *> *hashedUD = nil;
  if (userData) {
    hashedUD = (NSMutableDictionary<NSString *, NSString *> *)[FBSDKTypeUtility JSONObjectWithData:[userData dataUsingEncoding:NSUTF8StringEncoding]
                                                             options: NSJSONReadingMutableContainers
                                                             error: nil];
  }
  if (!hashedUD) {
    hashedUD = [[NSMutableDictionary alloc] init];
  }
  return hashedUD;
}

+ (NSString *)stringByHashedData:(id)hashedData
{
  NSError *error;
  NSData *jsonData = [FBSDKTypeUtility dataWithJSONObject:hashedData
                                                  options:0
                                                    error:&error];
  if (jsonData) {
    return [[NSString alloc] initWithData:jsonData
                                 encoding:NSUTF8StringEncoding];
  } else {
    return @"";
  }
}

+ (NSString *)encryptData:(NSString *)data
                     type:(FBSDKAppEventUserDataType)type
{
  if (data.length == 0 || [FBSDKUserDataStore maybeSHA256Hashed:data]) {
    return data;
  }
  return [FBSDKBasicUtility SHA256Hash:[FBSDKUserDataStore normalizeData:data type:type]];
}

+ (NSString *)normalizeData:(NSString *)data
                       type:(FBSDKAppEventUserDataType)type
{
  NSString *normalizedData = @"";
  NSSet<FBSDKAppEventUserDataType> *set = [NSSet setWithArray:
                                           @[FBSDKAppEventEmail, FBSDKAppEventFirstName, FBSDKAppEventLastName, FBSDKAppEventCity, FBSDKAppEventState, FBSDKAppEventCountry]];
  if ([set containsObject:type]) {
    normalizedData = [data stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
    normalizedData = normalizedData.lowercaseString;
  } else if ([type isEqualToString:FBSDKAppEventPhone]) {
    NSError *error = nil;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"[^0-9]"
                                                                           options:NSRegularExpressionCaseInsensitive
                                                                             error:&error
    ];
    normalizedData = [regex stringByReplacingMatchesInString:data
                                                     options:0
                                                       range:NSMakeRange(0, data.length)
                                                withTemplate:@""
    ];
  } else if ([type isEqualToString:FBSDKAppEventGender]) {
    NSString *temp = [data stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
    temp = temp.lowercaseString;
    normalizedData = temp.length > 0 ? [temp substringToIndex:1] : @"";
  }
  return normalizedData;
}

+ (BOOL)maybeSHA256Hashed:(NSString *)data
{
  NSRange range = [data rangeOfString:@"[A-Fa-f0-9]{64}" options:NSRegularExpressionSearch];
  return (data.length == 64) && (range.location != NSNotFound);
}

@end

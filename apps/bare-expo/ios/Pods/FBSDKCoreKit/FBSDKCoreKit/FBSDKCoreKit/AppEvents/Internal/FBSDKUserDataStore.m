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

#import "FBSDKAppEventsUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings.h"
#import "FBSDKUtility.h"

static NSString *const  FBSDKUserDataKey  = @"com.facebook.appevents.UserDataStore.userData";

static NSMutableDictionary<NSString *, NSString *> *hashedUserData;
static dispatch_queue_t serialQueue;

@implementation FBSDKUserDataStore

+ (void)initialize
{
  serialQueue = dispatch_queue_create("com.facebook.appevents.UserDataStore", DISPATCH_QUEUE_SERIAL);
  NSString *userData = [[NSUserDefaults standardUserDefaults] stringForKey:FBSDKUserDataKey];
  if (userData) {
    hashedUserData = (NSMutableDictionary<NSString *, NSString *> *)[NSJSONSerialization JSONObjectWithData:[userData dataUsingEncoding:NSUTF8StringEncoding]
                                                                                                    options:NSJSONReadingMutableContainers
                                                                                                      error:nil];
  }
  if (!hashedUserData) {
    hashedUserData = [[NSMutableDictionary alloc] init];
  }
}

+ (void)setAndHashUserEmail:(nullable NSString *)email
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
    ud[FBSDKAppEventEmail] = [FBSDKUserDataStore encryptData:email type:FBSDKAppEventEmail];
  }
  if (firstName) {
    ud[FBSDKAppEventFirstName] = [FBSDKUserDataStore encryptData:firstName type:FBSDKAppEventFirstName];
  }
  if (lastName) {
    ud[FBSDKAppEventLastName] = [FBSDKUserDataStore encryptData:lastName type:FBSDKAppEventLastName];
  }
  if (phone) {
    ud[FBSDKAppEventPhone] = [FBSDKUserDataStore encryptData:phone type:FBSDKAppEventPhone];
  }
  if (dateOfBirth) {
    ud[FBSDKAppEventDateOfBirth] = [FBSDKUserDataStore encryptData:dateOfBirth type:FBSDKAppEventDateOfBirth];
  }
  if (gender) {
    ud[FBSDKAppEventGender] = [FBSDKUserDataStore encryptData:gender type:FBSDKAppEventGender];
  }
  if (city) {
    ud[FBSDKAppEventCity] = [FBSDKUserDataStore encryptData:city type:FBSDKAppEventCity];
  }
  if (state) {
    ud[FBSDKAppEventState] = [FBSDKUserDataStore encryptData:state type:FBSDKAppEventState];
  }
  if (zip) {
    ud[FBSDKAppEventZip] = [FBSDKUserDataStore encryptData:zip type:FBSDKAppEventZip];
  }
  if (country) {
    ud[FBSDKAppEventCountry] = [FBSDKUserDataStore encryptData:country type:FBSDKAppEventCountry];
  }

  dispatch_async(serialQueue, ^{
    hashedUserData = [ud mutableCopy];
    [[NSUserDefaults standardUserDefaults] setObject:[FBSDKUserDataStore stringByHashedData:hashedUserData]
                                              forKey:FBSDKUserDataKey];
  });
}

+ (void)setAndHashData:(nullable NSString *)data
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
      hashedUserData[type] = hashData;
    }
    [[NSUserDefaults standardUserDefaults] setObject:[FBSDKUserDataStore stringByHashedData:hashedUserData]
                                              forKey:FBSDKUserDataKey];
  });
}

+ (void)clearDataForType:(FBSDKAppEventUserDataType)type
{
  [FBSDKUserDataStore setAndHashData:nil forType:type];
}

+ (NSString *)getHashedData
{
  __block NSString *hashedUserDataString;
  dispatch_sync(serialQueue, ^{
    hashedUserDataString = [FBSDKUserDataStore stringByHashedData:hashedUserData];
  });
  return hashedUserDataString;
}

+ (NSString *)getHashedDataForType:(FBSDKAppEventUserDataType)type
{
  __block NSString *hashedData;
  dispatch_sync(serialQueue, ^{
    hashedData = [hashedUserData objectForKey:type];
  });
  return hashedData;
}

+ (NSString *)stringByHashedData:(id)hashedData
{
  NSError *error;
  NSData *jsonData = [NSJSONSerialization dataWithJSONObject:hashedData
                                                     options:0
                                                       error:&error];
  if (jsonData) {
    return [[NSString alloc] initWithData:jsonData
                                 encoding:NSUTF8StringEncoding];
  } else {
    [FBSDKAppEventsUtility logAndNotify:[NSString stringWithFormat:@"Invalid json object: %@", error]];
    return @"";
  }
}

+ (NSString *)encryptData:(NSString *)data
                     type:(FBSDKAppEventUserDataType)type
{
  if (data.length == 0 || [FBSDKUserDataStore maybeSHA256Hashed:data]) {
    return data;
  }
  return [FBSDKUtility SHA256Hash:[FBSDKUserDataStore normalizeData:data type:type]];
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
    normalizedData = temp.length > 0 ? [temp substringToIndex:1]: @"";
  }
  return normalizedData;
}

+ (BOOL)maybeSHA256Hashed:(NSString *)data
{
  NSRange range = [data rangeOfString:@"[A-Fa-f0-9]{64}" options:NSRegularExpressionSearch];
  return (data.length == 64) && (range.location != NSNotFound);
}

@end

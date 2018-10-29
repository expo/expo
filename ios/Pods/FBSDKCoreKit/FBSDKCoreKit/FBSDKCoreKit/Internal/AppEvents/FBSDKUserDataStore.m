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

#import <FBSDKSettings.h>

#import "FBSDKAppEventsUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKUtility.h"

#define USER_DATA_KEY @"com.facebook.appevents.UserDataStore.userData"

static NSString *const  FBSDKEmail        = @"em";
static NSString *const  FBSDKFirstName    = @"fn";
static NSString *const  FBSDKLastName     = @"ln";
static NSString *const  FBSDKPhone        = @"ph";
static NSString *const  FBSDKDateOfBirth  = @"db";
static NSString *const  FBSDKGender       = @"ge";
static NSString *const  FBSDKCity         = @"ct";
static NSString *const  FBSDKState        = @"st";
static NSString *const  FBSDKZip          = @"zp";
static NSString *const  FBSDKCountry      = @"country";

static NSString *hashedUserData;
static volatile bool initialized = false;

@implementation FBSDKUserDataStore

+ (void)initStore
{
  if (initialized){
    return;
  }

  [FBSDKUserDataStore initAndWait];
}

+ (void)initAndWait
{
  if (initialized){
    return;
  }

  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  hashedUserData = [defaults stringForKey:USER_DATA_KEY];
  initialized = true;
}

+ (void)setUserDataAndHash:(NSDictionary *)ud
{
  if (!initialized){
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                           logEntry:@"initStore should have been called before calling setUserData"];
    [FBSDKUserDataStore initAndWait];
  }

  hashedUserData = [FBSDKUserDataStore hashUserData:ud];
  NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];
  [defaults setObject:(hashedUserData) forKey:(USER_DATA_KEY)];
}

+ (void)setUserDataAndHash:(nullable NSString *)email
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
  if (!initialized){
    [FBSDKUserDataStore initAndWait];
  }

  NSMutableDictionary *ud = [[NSMutableDictionary alloc] init];
  if (email != nil) {
    ud[FBSDKEmail] = email;
  }
  if (firstName != nil) {
    ud[FBSDKFirstName] = firstName;
  }
  if (lastName != nil) {
    ud[FBSDKLastName] = lastName;
  }
  if (phone != nil) {
    ud[FBSDKPhone] = phone;
  }
  if (dateOfBirth != nil) {
    ud[FBSDKDateOfBirth] = dateOfBirth;
  }
  if (gender != nil) {
    ud[FBSDKGender] = gender;
  }
  if (city != nil) {
    ud[FBSDKCity] = city;
  }
  if (state != nil) {
    ud[FBSDKState] = state;
  }
  if (zip != nil) {
    ud[FBSDKZip] = zip;
  }
  if (country != nil) {
    ud[FBSDKCountry] = country;
  }

  hashedUserData = [FBSDKUserDataStore hashUserData:ud];
  NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];
  [defaults setObject:(hashedUserData) forKey:(USER_DATA_KEY)];
}

+ (NSString *)getHashedUserData
{
  if (!initialized){
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                           logEntry:@"initStore should have been called before calling setUserID"];
    [FBSDKUserDataStore initAndWait];
  }

  return hashedUserData;
}

+ (NSString *)hashUserData:(NSDictionary *)ud
{
  if (ud == nil){
    return nil;
  }

  NSMutableDictionary *encryptUserData = [NSMutableDictionary dictionaryWithCapacity:[ud count]];

  for (NSString *key in ud){
    NSString *const value = ud[key];
    if ([FBSDKUserDataStore maybeSHA256Hashed:value]){
      encryptUserData[key] = value;
    } else {
      NSString *const normalizedValue = [FBSDKUserDataStore normalizeData:key data:value];
      NSString *const encryptedValue = [FBSDKUserDataStore encryptData:normalizedValue];
      if (encryptedValue != nil){
        encryptUserData[key] = encryptedValue;
      }
    }
  }

  NSError *error;
  NSData *jsonData = [NSJSONSerialization dataWithJSONObject:encryptUserData
                                                     options:0
                                                       error:&error];
  if (jsonData){
    return [[NSString alloc] initWithData:jsonData
                                 encoding:NSUTF8StringEncoding];
  } else {
    [FBSDKAppEventsUtility logAndNotify:[NSString stringWithFormat:@"invalid json object: %@", error]];
    return nil;
  }
}

+ (NSString *)encryptData:(NSString *)data
{
  if (data == nil || [data length] == 0){
    return nil;
  }
  return [FBSDKUtility SHA256Hash:data];
}

+ (NSString *)normalizeData:(NSString *)type data:(NSString *)data{
  NSString *normalizedData = @"";
  if ([type isEqualToString:FBSDKEmail] || [type isEqualToString:FBSDKFirstName]
      || [type isEqualToString:FBSDKLastName] || [type isEqualToString:FBSDKCity]
      || [type isEqualToString:FBSDKState] || [type isEqualToString:FBSDKCountry]) {
    normalizedData = [data stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
    normalizedData = [normalizedData lowercaseString];
  } else if ([type isEqualToString:FBSDKPhone]){
    NSError *error = nil;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"[^0-9]"
                                                                           options:NSRegularExpressionCaseInsensitive
                                                                             error:&error
                                  ];
    normalizedData = [regex stringByReplacingMatchesInString:data
                                                     options:0
                                                       range:NSMakeRange(0, [data length])
                                                withTemplate:@""
                      ];
  } else if ([type isEqualToString:FBSDKGender]){
    NSString *temp = [data stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
    temp = [temp lowercaseString];
    normalizedData = [temp length] > 0 ? [temp substringToIndex:1]: @"";
  }

  return normalizedData;
}

+ (BOOL)maybeSHA256Hashed:(NSString *)data
{
  NSRange range = [data rangeOfString:@"[A-Fa-f0-9]{64}" options:NSRegularExpressionSearch];
  return ([data length] == 64) && (range.location != NSNotFound);
}

@end

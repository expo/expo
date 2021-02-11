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

#import "FBSDKErrorRecoveryConfiguration.h"

#define FBSDK_ERROR_RECOVERY_CONFIGURATION_DESCRIPTION_KEY @"description"
#define FBSDK_ERROR_RECOVERY_CONFIGURATION_OPTIONS_KEY @"options"
#define FBSDK_ERROR_RECOVERY_CONFIGURATION_CATEGORY_KEY @"category"
#define FBSDK_ERROR_RECOVERY_CONFIGURATION_ACTION_KEY @"action"

@implementation FBSDKErrorRecoveryConfiguration

- (instancetype)initWithRecoveryDescription:(NSString *)description
                         optionDescriptions:(NSArray *)optionDescriptions
                                   category:(FBSDKGraphRequestError)category
                         recoveryActionName:(NSString *)recoveryActionName
{
  if ((self = [super init])) {
    _localizedRecoveryDescription = [description copy];
    _localizedRecoveryOptionDescriptions = [optionDescriptions copy];
    _errorCategory = category;
    _recoveryActionName = [recoveryActionName copy];
  }
  return self;
}

#pragma mark - NSSecureCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  NSString *description = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_ERROR_RECOVERY_CONFIGURATION_DESCRIPTION_KEY];
  NSArray *options = [decoder decodeObjectOfClass:[NSArray class] forKey:FBSDK_ERROR_RECOVERY_CONFIGURATION_OPTIONS_KEY];
  NSNumber *category = [decoder decodeObjectOfClass:[NSNumber class] forKey:FBSDK_ERROR_RECOVERY_CONFIGURATION_CATEGORY_KEY];
  NSString *action = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_ERROR_RECOVERY_CONFIGURATION_ACTION_KEY];

  return [self initWithRecoveryDescription:description
                        optionDescriptions:options
                                  category:category.unsignedIntegerValue
                        recoveryActionName:action];
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_localizedRecoveryDescription forKey:FBSDK_ERROR_RECOVERY_CONFIGURATION_DESCRIPTION_KEY];
  [encoder encodeObject:_localizedRecoveryOptionDescriptions forKey:FBSDK_ERROR_RECOVERY_CONFIGURATION_OPTIONS_KEY];
  [encoder encodeObject:@(_errorCategory) forKey:FBSDK_ERROR_RECOVERY_CONFIGURATION_CATEGORY_KEY];
  [encoder encodeObject:_recoveryActionName forKey:FBSDK_ERROR_RECOVERY_CONFIGURATION_ACTION_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  // immutable
  return self;
}

@end

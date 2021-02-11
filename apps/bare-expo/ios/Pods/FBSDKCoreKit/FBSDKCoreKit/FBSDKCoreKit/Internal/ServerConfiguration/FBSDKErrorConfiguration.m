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

#import "FBSDKErrorConfiguration.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKErrorRecoveryConfiguration.h"

static NSString *const kErrorCategoryOther = @"other";
static NSString *const kErrorCategoryTransient = @"transient";
static NSString *const kErrorCategoryLogin = @"login";

#define FBSDKERRORCONFIGURATION_DICTIONARY_KEY @"configurationDictionary"

@implementation FBSDKErrorConfiguration
{
  NSMutableDictionary *_configurationDictionary;
}

- (instancetype)initWithDictionary:(NSDictionary *)dictionary
{
  if ((self = [super init])) {
    if (dictionary) {
      _configurationDictionary = [NSMutableDictionary dictionaryWithDictionary:dictionary];
    } else {
      _configurationDictionary = [NSMutableDictionary dictionary];
      NSString *localizedOK =
      NSLocalizedStringWithDefaultValue(
        @"ErrorRecovery.OK",
        @"FacebookSDK",
        [FBSDKInternalUtility bundleForStrings],
        @"OK",
        @"The title of the label to start attempting error recovery"
      );
      NSString *localizedCancel =
      NSLocalizedStringWithDefaultValue(
        @"ErrorRecovery.Cancel",
        @"FacebookSDK",
        [FBSDKInternalUtility bundleForStrings],
        @"Cancel",
        @"The title of the label to decline attempting error recovery"
      );
      NSString *localizedTransientSuggestion =
      NSLocalizedStringWithDefaultValue(
        @"ErrorRecovery.Transient.Suggestion",
        @"FacebookSDK",
        [FBSDKInternalUtility bundleForStrings],
        @"The server is temporarily busy, please try again.",
        @"The fallback message to display to retry transient errors"
      );
      NSString *localizedLoginRecoverableSuggestion =
      NSLocalizedStringWithDefaultValue(
        @"ErrorRecovery.Login.Suggestion",
        @"FacebookSDK",
        [FBSDKInternalUtility bundleForStrings],
        @"Please log into this app again to reconnect your Facebook account.",
        @"The fallback message to display to recover invalidated tokens"
      );
      NSArray *fallbackArray = @[
        @{ @"name" : @"login",
           @"items" : @[@{ @"code" : @102 },
                        @{ @"code" : @190 }],
           @"recovery_message" : localizedLoginRecoverableSuggestion,
           @"recovery_options" : @[localizedOK, localizedCancel]},
        @{ @"name" : @"transient",
           @"items" : @[@{ @"code" : @1 },
                        @{ @"code" : @2 },
                        @{ @"code" : @4 },
                        @{ @"code" : @9 },
                        @{ @"code" : @17 },
                        @{ @"code" : @341 }],
           @"recovery_message" : localizedTransientSuggestion,
           @"recovery_options" : @[localizedOK]},
      ];
      [self parseArray:fallbackArray];
    }
  }
  return self;
}

- (FBSDKErrorRecoveryConfiguration *)recoveryConfigurationForCode:(NSString *)code subcode:(NSString *)subcode request:(FBSDKGraphRequest *)request
{
  code = code ?: @"*";
  subcode = subcode ?: @"*";
  FBSDKErrorRecoveryConfiguration *configuration = (_configurationDictionary[code][subcode]
    ?: _configurationDictionary[code][@"*"]
      ?: _configurationDictionary[@"*"][subcode]
        ?: _configurationDictionary[@"*"][@"*"]);
  if (configuration.errorCategory == FBSDKGraphRequestErrorRecoverable
      && [FBSDKSettings clientToken]
      && [request.parameters[@"access_token"] hasSuffix:[FBSDKSettings clientToken]]) {
    // do not attempt to recovery client tokens.
    return nil;
  }
  return configuration;
}

- (void)parseArray:(NSArray<NSDictionary *> *)array
{
  for (NSDictionary *dictionary in [FBSDKTypeUtility arrayValue:array]) {
    [FBSDKTypeUtility dictionary:dictionary enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
      FBSDKGraphRequestError category;
      NSString *action = [FBSDKTypeUtility stringValue:dictionary[@"name"]];
      if ([action isEqualToString:kErrorCategoryOther]) {
        category = FBSDKGraphRequestErrorOther;
      } else if ([action isEqualToString:kErrorCategoryTransient]) {
        category = FBSDKGraphRequestErrorTransient;
      } else {
        category = FBSDKGraphRequestErrorRecoverable;
      }
      NSString *suggestion = dictionary[@"recovery_message"];
      NSArray *options = dictionary[@"recovery_options"];

      NSArray *validItems = [FBSDKTypeUtility dictionary:dictionary objectForKey:@"items" ofType:NSArray.class];
      for (NSDictionary *codeSubcodesDictionary in validItems) {
        NSDictionary *validCodeSubcodesDictionary = [FBSDKTypeUtility dictionaryValue:codeSubcodesDictionary];
        if (!validCodeSubcodesDictionary) {
          continue;
        }

        NSNumber *numericCode = [FBSDKTypeUtility dictionary:validCodeSubcodesDictionary objectForKey:@"code" ofType:NSNumber.class];
        NSString *code = numericCode.stringValue;
        if (!code) {
          return;
        }

        NSMutableDictionary *currentSubcodes = self->_configurationDictionary[code];
        if (!currentSubcodes) {
          currentSubcodes = [NSMutableDictionary dictionary];
          [FBSDKTypeUtility dictionary:self->_configurationDictionary setObject:currentSubcodes forKey:code];
        }

        NSArray *validSubcodes = [FBSDKTypeUtility dictionary:validCodeSubcodesDictionary objectForKey:@"subcodes" ofType:NSArray.class];
        if (validSubcodes.count > 0) {
          for (NSNumber *subcodeNumber in validSubcodes) {
            NSNumber *validSubcodeNumber = [FBSDKTypeUtility numberValue:subcodeNumber];
            if (validSubcodeNumber == nil) {
              continue;
            }
            [FBSDKTypeUtility dictionary:currentSubcodes setObject:[[FBSDKErrorRecoveryConfiguration alloc]
                                                                    initWithRecoveryDescription:suggestion
                                                                    optionDescriptions:options
                                                                    category:category
                                                                    recoveryActionName:action] forKey:validSubcodeNumber.stringValue];
          }
        } else {
          [FBSDKTypeUtility dictionary:currentSubcodes setObject:[[FBSDKErrorRecoveryConfiguration alloc]
                                                                  initWithRecoveryDescription:suggestion
                                                                  optionDescriptions:options
                                                                  category:category
                                                                  recoveryActionName:action] forKey:@"*"];
        }
      }
    }];
  }
}

#pragma mark - NSSecureCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  NSSet *classes = [[NSSet alloc] initWithObjects:[NSDictionary class], [FBSDKErrorRecoveryConfiguration class], nil];
  NSDictionary *configurationDictionary = [decoder decodeObjectOfClasses:classes
                                                                  forKey:FBSDKERRORCONFIGURATION_DICTIONARY_KEY];
  return [self initWithDictionary:configurationDictionary];
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_configurationDictionary forKey:FBSDKERRORCONFIGURATION_DICTIONARY_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  return self;
}

@end

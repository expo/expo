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

- (instancetype)init
{
  FBSDK_NOT_DESIGNATED_INITIALIZER(initWithDictionary:);
  return [self initWithDictionary:nil];
}

- (instancetype)initWithDictionary:(NSDictionary *)dictionary
{
  if ((self = [super init])) {
    if (dictionary) {
      _configurationDictionary = [NSMutableDictionary dictionaryWithDictionary:dictionary];
    } else {
      _configurationDictionary = [NSMutableDictionary dictionary];
      NSString *localizedOK =
      NSLocalizedStringWithDefaultValue(@"ErrorRecovery.OK", @"FacebookSDK", [FBSDKInternalUtility bundleForStrings],
                                        @"OK",
                                        @"The title of the label to start attempting error recovery");
      NSString *localizedCancel =
      NSLocalizedStringWithDefaultValue(@"ErrorRecovery.Cancel", @"FacebookSDK", [FBSDKInternalUtility bundleForStrings],
                                        @"Cancel",
                                        @"The title of the label to decline attempting error recovery");
      NSString *localizedTransientSuggestion =
      NSLocalizedStringWithDefaultValue(@"ErrorRecovery.Transient.Suggestion", @"FacebookSDK", [FBSDKInternalUtility bundleForStrings],
                                        @"The server is temporarily busy, please try again.",
                                        @"The fallback message to display to retry transient errors");
      NSString *localizedLoginRecoverableSuggestion =
      NSLocalizedStringWithDefaultValue(@"ErrorRecovery.Login.Suggestion", @"FacebookSDK", [FBSDKInternalUtility bundleForStrings],
                                        @"Please log into this app again to reconnect your Facebook account.",
                                        @"The fallback message to display to recover invalidated tokens");
      NSArray *fallbackArray = @[
                                 @{ @"name" : @"login",
                                    @"items" : @[ @{ @"code" : @102 },
                                                  @{ @"code" : @190 } ],
                                    @"recovery_message" : localizedLoginRecoverableSuggestion,
                                    @"recovery_options" : @[ localizedOK, localizedCancel]
                                    },
                                 @{ @"name" : @"transient",
                                    @"items" : @[ @{ @"code" : @1 },
                                                  @{ @"code" : @2 },
                                                  @{ @"code" : @4 },
                                                  @{ @"code" : @9 },
                                                  @{ @"code" : @17 },
                                                  @{ @"code" : @341 } ],
                                    @"recovery_message" : localizedTransientSuggestion,
                                    @"recovery_options" : @[ localizedOK]
                                    },
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
  FBSDKErrorRecoveryConfiguration *configuration = (_configurationDictionary[code][subcode] ?:
                                                    _configurationDictionary[code][@"*"] ?:
                                                    _configurationDictionary[@"*"][subcode] ?:
                                                    _configurationDictionary[@"*"][@"*"]);
  if (configuration.errorCategory == FBSDKGraphRequestErrorCategoryRecoverable &&
      [FBSDKSettings clientToken] &&
      [request.parameters[@"access_token"] hasSuffix:[FBSDKSettings clientToken]]) {
    // do not attempt to recovery client tokens.
    return nil;
  }
  return configuration;
}

- (void)parseArray:(NSArray *)array
{
  for (NSDictionary *dictionary in array) {
    [dictionary enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
      FBSDKGraphRequestErrorCategory category;
      NSString *action = dictionary[@"name"];
      if ([action isEqualToString:kErrorCategoryOther]) {
        category = FBSDKGraphRequestErrorCategoryOther;
      } else if ([action isEqualToString:kErrorCategoryTransient]) {
        category = FBSDKGraphRequestErrorCategoryTransient;
      } else {
        category = FBSDKGraphRequestErrorCategoryRecoverable;
      }
      NSString *suggestion = dictionary[@"recovery_message"];
      NSArray *options = dictionary[@"recovery_options"];
      for (NSDictionary *codeSubcodesDictionary in dictionary[@"items"]) {
        NSString *code = [codeSubcodesDictionary[@"code"] stringValue];

        NSMutableDictionary *currentSubcodes = _configurationDictionary[code];
        if (!currentSubcodes) {
          currentSubcodes = [NSMutableDictionary dictionary];
          _configurationDictionary[code] = currentSubcodes;
        }

        NSArray *subcodes = codeSubcodesDictionary[@"subcodes"];
        if (subcodes.count > 0) {
          for (NSNumber *subcodeNumber in subcodes) {
            currentSubcodes[[subcodeNumber stringValue]] = [[FBSDKErrorRecoveryConfiguration alloc]
                                                            initWithRecoveryDescription:suggestion
                                                            optionDescriptions:options
                                                            category:category
                                                            recoveryActionName:action];
          }
        } else {
          currentSubcodes[@"*"] = [[FBSDKErrorRecoveryConfiguration alloc]
                                                          initWithRecoveryDescription:suggestion
                                                          optionDescriptions:options
                                                          category:category
                                                          recoveryActionName:action];
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
  NSDictionary *configurationDictionary = [decoder decodeObjectOfClass:[NSDictionary class] forKey:FBSDKERRORCONFIGURATION_DICTIONARY_KEY];
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

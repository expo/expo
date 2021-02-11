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

#import "FBSDKFeatureManager.h"

#import "FBSDKSettings.h"
#import "ServerConfiguration/FBSDKGateKeeperManager.h"

static NSString *const FBSDKFeatureManagerPrefix = @"com.facebook.sdk:FBSDKFeatureManager.FBSDKFeature";

NS_ASSUME_NONNULL_BEGIN

@implementation FBSDKFeatureManager

#pragma mark - Public methods

+ (void)checkFeature:(FBSDKFeature)feature
     completionBlock:(FBSDKFeatureManagerBlock)completionBlock
{
  // check if the feature is locally disabled by Crash Shield first
  NSString *version = [[NSUserDefaults standardUserDefaults] valueForKey:[FBSDKFeatureManagerPrefix stringByAppendingString:[self featureName:feature]]];
  if (version && [version isEqualToString:[FBSDKSettings sdkVersion]]) {
    if (completionBlock) {
      completionBlock(false);
    }
    return;
  }
  // check gk
  [FBSDKGateKeeperManager loadGateKeepers:^(NSError *_Nullable error) {
    if (completionBlock) {
      completionBlock([FBSDKFeatureManager isEnabled:feature]);
    }
  }];
}

+ (BOOL)isEnabled:(FBSDKFeature)feature
{
  if (FBSDKFeatureCore == feature) {
    return YES;
  }

  FBSDKFeature parentFeature = [self getParentFeature:feature];
  if (parentFeature == feature) {
    return [self checkGK:feature];
  } else {
    return [FBSDKFeatureManager isEnabled:parentFeature] && [self checkGK:feature];
  }
}

+ (void)disableFeature:(NSString *)featureName
{
  [[NSUserDefaults standardUserDefaults] setObject:[FBSDKSettings sdkVersion] forKey:[FBSDKFeatureManagerPrefix stringByAppendingString:featureName]];
}

#pragma mark - Private methods

+ (FBSDKFeature)getParentFeature:(FBSDKFeature)feature
{
  if ((feature & 0xFF) > 0) {
    return feature & 0xFFFFFF00;
  } else if ((feature & 0xFF00) > 0) {
    return feature & 0xFFFF0000;
  } else if ((feature & 0xFF0000) > 0) {
    return feature & 0xFF000000;
  } else {
    return 0;
  }
}

+ (BOOL)checkGK:(FBSDKFeature)feature
{
  NSString *key = [NSString stringWithFormat:@"FBSDKFeature%@", [self featureName:feature]];
  BOOL defaultValue = [self defaultStatus:feature];

  return [FBSDKGateKeeperManager boolForKey:key
                               defaultValue:defaultValue];
}

+ (NSString *)featureName:(FBSDKFeature)feature
{
  NSString *featureName;
  switch (feature) {
    case FBSDKFeatureCore: featureName = @"CoreKit"; break;
    case FBSDKFeatureAppEvents: featureName = @"AppEvents"; break;
    case FBSDKFeatureCodelessEvents: featureName = @"CodelessEvents"; break;
    case FBSDKFeatureRestrictiveDataFiltering: featureName = @"RestrictiveDataFiltering"; break;
    case FBSDKFeatureAAM: featureName = @"AAM"; break;
    case FBSDKFeaturePrivacyProtection: featureName = @"PrivacyProtection"; break;
    case FBSDKFeatureSuggestedEvents: featureName = @"SuggestedEvents"; break;
    case FBSDKFeatureIntelligentIntegrity: featureName = @"IntelligentIntegrity"; break;
    case FBSDKFeatureModelRequest: featureName = @"ModelRequest"; break;
    case FBSDKFeatureEventDeactivation: featureName = @"EventDeactivation"; break;
    case FBSDKFeatureSKAdNetwork: featureName = @"SKAdNetwork"; break;
    case FBSDKFeatureSKAdNetworkConversionValue: featureName = @"SKAdNetworkConversionValue"; break;
    case FBSDKFeatureInstrument: featureName = @"Instrument"; break;
    case FBSDKFeatureCrashReport: featureName = @"CrashReport"; break;
    case FBSDKFeatureCrashShield: featureName = @"CrashShield"; break;
    case FBSDKFeatureErrorReport: featureName = @"ErrorReport"; break;
    case FBSDKFeatureATELogging: featureName = @"ATELogging"; break;

    case FBSDKFeatureLogin: featureName = @"LoginKit"; break;

    case FBDSDKFeatureShare: featureName = @"ShareKit"; break;

    case FBDSDKFeatureGamingServices: featureName = @"GamingServicesKit"; break;
  }

  return featureName;
}

+ (BOOL)defaultStatus:(FBSDKFeature)feature
{
  switch (feature) {
    case FBSDKFeatureRestrictiveDataFiltering:
    case FBSDKFeatureEventDeactivation:
    case FBSDKFeatureInstrument:
    case FBSDKFeatureCrashReport:
    case FBSDKFeatureCrashShield:
    case FBSDKFeatureErrorReport:
    case FBSDKFeatureAAM:
    case FBSDKFeaturePrivacyProtection:
    case FBSDKFeatureSuggestedEvents:
    case FBSDKFeatureIntelligentIntegrity:
    case FBSDKFeatureModelRequest:
    case FBSDKFeatureATELogging:
    case FBSDKFeatureSKAdNetwork:
    case FBSDKFeatureSKAdNetworkConversionValue:
      return NO;
    case FBSDKFeatureLogin:
    case FBDSDKFeatureShare:
    case FBSDKFeatureCore:
    case FBSDKFeatureAppEvents:
    case FBSDKFeatureCodelessEvents:
    case FBDSDKFeatureGamingServices:
      return YES;
  }
}

@end

NS_ASSUME_NONNULL_END

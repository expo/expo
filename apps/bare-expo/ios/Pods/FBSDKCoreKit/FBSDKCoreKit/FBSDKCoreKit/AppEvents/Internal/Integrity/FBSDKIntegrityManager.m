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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKIntegrityManager.h"

 #import "FBSDKGateKeeperManager.h"
 #import "FBSDKInternalUtility.h"
 #import "FBSDKModelManager.h"
 #import "FBSDKSettings.h"

static BOOL isIntegrityEnabled = NO;
static BOOL isSampleEnabled = NO;

@implementation FBSDKIntegrityManager

+ (void)enable
{
  isIntegrityEnabled = YES;
  isSampleEnabled = [FBSDKGateKeeperManager boolForKey:@"FBSDKFeatureIntegritySample" defaultValue:false];
}

+ (nullable NSDictionary<NSString *, id> *)processParameters:(nullable NSDictionary<NSString *, id> *)parameters
{
  if (!isIntegrityEnabled || parameters.count == 0) {
    return parameters;
  }
  NSMutableDictionary<NSString *, id> *params = [NSMutableDictionary dictionaryWithDictionary:parameters];
  NSMutableDictionary<NSString *, id> *restrictiveParams = [NSMutableDictionary dictionary];

  for (NSString *key in [parameters keyEnumerator]) {
    NSString *valueString = [FBSDKTypeUtility stringValue:parameters[key]];
    BOOL shouldFilter = [FBSDKModelManager processIntegrity:key] || [FBSDKModelManager processIntegrity:valueString];
    if (shouldFilter) {
      [FBSDKTypeUtility dictionary:restrictiveParams setObject:isSampleEnabled ? valueString : @"" forKey:key];
      [params removeObjectForKey:key];
    }
  }
  if ([restrictiveParams count] > 0) {
    NSString *restrictiveParamsJSONString = [FBSDKBasicUtility JSONStringForObject:restrictiveParams
                                                                             error:NULL
                                                              invalidObjectHandler:NULL];
    [FBSDKTypeUtility dictionary:params setObject:restrictiveParamsJSONString forKey:@"_onDeviceParams"];
  }
  return [params copy];
}

@end

#endif

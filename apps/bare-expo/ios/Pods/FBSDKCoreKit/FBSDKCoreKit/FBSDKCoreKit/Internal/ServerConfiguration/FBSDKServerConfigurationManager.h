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

#import <Foundation/Foundation.h>

#import "FBSDKServerConfiguration.h"

#define FBSDK_SERVER_CONFIGURATION_MANAGER_CACHE_TIMEOUT (60 * 60)
typedef void (^FBSDKServerConfigurationBlock)(FBSDKServerConfiguration *serverConfiguration, NSError *error)
NS_SWIFT_NAME(ServerConfigurationBlock);

NS_SWIFT_NAME(ServerConfigurationManager)
@interface FBSDKServerConfigurationManager : NSObject

/**
  Returns the locally cached configuration.

 The result will be valid for the appID from FBSDKSettings, but may be expired. A network request will be
 initiated to update the configuration if a valid and unexpired configuration is not available.
 */
+ (FBSDKServerConfiguration *)cachedServerConfiguration;

/**
  Executes the completionBlock with a valid and current configuration when it is available.

 This method will use a cached configuration if it is valid and not expired.
 */
+ (void)loadServerConfigurationWithCompletionBlock:(FBSDKServerConfigurationBlock)completionBlock;

@end

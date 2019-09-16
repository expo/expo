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

#import "FBSDKDeviceRequestsHelper.h"

#import <sys/utsname.h>

#import <UIKit/UIKit.h>

#import "FBSDKCoreKit+Internal.h"

#define FBSDK_DEVICE_INFO_DEVICE @"device"
#define FBSDK_DEVICE_INFO_MODEL @"model"
#define FBSDK_HEADER @"fbsdk"
#if !TARGET_OS_TV
#define FBSDK_FLAVOR @"ios"
#else
#define FBSDK_FLAVOR @"tvos"
#endif
#define FBSDK_SERVICE_TYPE @"_fb._tcp."

static NSMapTable *g_mdnsAdvertisementServices;

@implementation FBSDKDeviceRequestsHelper

#pragma mark - Class Methods

+ (void)initialize {
  // We use weak to strong in order to retain the advertisement services
  // without having to pass them back to the delegate that started them
  // Note that in case the delegate is destroyed before it had a chance to
  // stop the service, the service will continue broadcasting until the map
  // resizes itself and releases the service, causing it to stop
  g_mdnsAdvertisementServices = [NSMapTable weakToStrongObjectsMapTable];
}

+ (NSString *)getDeviceInfo
{
  struct utsname systemInfo;
  uname(&systemInfo);
  NSDictionary<NSString *, NSString *> *deviceInfo = @{
                               FBSDK_DEVICE_INFO_DEVICE: @(systemInfo.machine),
                               FBSDK_DEVICE_INFO_MODEL: [UIDevice currentDevice].model,
                               };
  NSError *err;
  NSData *jsonDeviceInfo = [NSJSONSerialization dataWithJSONObject:deviceInfo
                                                           options:0
                                                             error:&err];

  return [[NSString alloc] initWithData:jsonDeviceInfo encoding:NSUTF8StringEncoding];
}

+ (BOOL)startAdvertisementService:(NSString *)loginCode withDelegate:(id<NSNetServiceDelegate>)delegate
{
   static NSString *sdkVersion = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
     // Dots in the version will mess up the bonjour DNS record parsing
    sdkVersion = [[FBSDKSettings sdkVersion] stringByReplacingOccurrencesOfString:@"." withString:@"|"];
    if (sdkVersion.length > 10 ||
        ![[NSCharacterSet decimalDigitCharacterSet] characterIsMember:[sdkVersion characterAtIndex:0]]) {
      sdkVersion = @"dev";
    }
  });
  NSString *serviceName = [NSString stringWithFormat:@"%@_%@_%@",
                                                     FBSDK_HEADER,
                                                     [NSString stringWithFormat:@"%@-%@",
                                                                                FBSDK_FLAVOR,
                                                                                sdkVersion
                                                     ],
                                                     loginCode
                          ];
  if (serviceName.length > 60) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors logEntry:@"serviceName exceeded 60 characters"];
  }
  NSNetService *mdnsAdvertisementService = [[NSNetService alloc]
                                            initWithDomain:@"local."
                                            type:FBSDK_SERVICE_TYPE
                                            name:serviceName
                                            port:0];
  mdnsAdvertisementService.delegate = delegate;
  [mdnsAdvertisementService publishWithOptions:NSNetServiceNoAutoRename | NSNetServiceListenForConnections];
  [FBSDKAppEvents logInternalEvent:FBSDKAppEventNameFBSDKSmartLoginService
                isImplicitlyLogged:YES];
  [g_mdnsAdvertisementServices setObject:mdnsAdvertisementService forKey:delegate];

  return YES;
}

+ (BOOL)isDelegate:(id<NSNetServiceDelegate>)delegate forAdvertisementService:(NSNetService *)service
{
  NSNetService *mdnsAdvertisementService = [g_mdnsAdvertisementServices objectForKey:delegate];
  return (mdnsAdvertisementService == service);
}

+ (void)cleanUpAdvertisementService:(id<NSNetServiceDelegate>)delegate
{
  NSNetService *mdnsAdvertisementService = [g_mdnsAdvertisementServices objectForKey:delegate];
  if (mdnsAdvertisementService != nil) {
    // We are not interested in the stop publish event
    mdnsAdvertisementService.delegate = nil;
    [mdnsAdvertisementService stop];
    [g_mdnsAdvertisementServices removeObjectForKey:delegate];
  }
}

@end

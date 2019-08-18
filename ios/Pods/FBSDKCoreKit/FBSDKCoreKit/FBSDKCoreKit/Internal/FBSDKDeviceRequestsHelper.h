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
#import <UIKit/UIKit.h>

#define FBSDK_DEVICE_INFO_PARAM @"device_info"

/*
 @class

  Helper class for device requests mDNS broadcasts. Note this is only intended for
 internal consumption.
 */
@interface FBSDKDeviceRequestsHelper : NSObject

/**
  Get device info to include with the GraphRequest
 */
+ (NSString *)getDeviceInfo;

/**
  Start the mDNS advertisement service for a device request
 @param loginCode The login code associated with the action for the device request.
 @return True if the service broadcast was successfully started.
 */
+ (BOOL)startAdvertisementService:(NSString *)loginCode withDelegate:(id<NSNetServiceDelegate>)delegate;

/**
  Check if a service delegate is registered with particular advertisement service
 @param delegate The delegate to check if registered.
 @param service The advertisement service to check for.
 @return True if the service is the one the delegate registered with.
 */
+ (BOOL)isDelegate:(id<NSNetServiceDelegate>)delegate forAdvertisementService:(NSNetService *)service;

/**
  Stop the mDNS advertisement service for a device request
 @param delegate The delegate registered with the service.
 */
+ (void)cleanUpAdvertisementService:(id<NSNetServiceDelegate>)delegate;

@end

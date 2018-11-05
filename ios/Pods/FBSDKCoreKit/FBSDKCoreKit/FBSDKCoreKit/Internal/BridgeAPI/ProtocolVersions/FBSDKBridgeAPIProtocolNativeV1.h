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

#import <UIKit/UIKit.h>

#import <FBSDKCoreKit/FBSDKMacros.h>

#import "FBSDKBridgeAPIProtocol.h"

typedef struct
{
  __unsafe_unretained NSString *bridgeArgs;
  __unsafe_unretained NSString *methodArgs;
  __unsafe_unretained NSString *methodVersion;
} FBSDKBridgeAPIProtocolNativeV1OutputKeysStruct;
FBSDK_EXTERN const FBSDKBridgeAPIProtocolNativeV1OutputKeysStruct FBSDKBridgeAPIProtocolNativeV1OutputKeys;

typedef struct
{
  __unsafe_unretained NSString *actionID;
  __unsafe_unretained NSString *appIcon;
  __unsafe_unretained NSString *appName;
  __unsafe_unretained NSString *sdkVersion;
} FBSDKBridgeAPIProtocolNativeV1BridgeParameterOutputKeysStruct;
FBSDK_EXTERN const FBSDKBridgeAPIProtocolNativeV1BridgeParameterOutputKeysStruct FBSDKBridgeAPIProtocolNativeV1BridgeParameterOutputKeys;

typedef struct
{
  __unsafe_unretained NSString *bridgeArgs;
  __unsafe_unretained NSString *methodResults;
} FBSDKBridgeAPIProtocolNativeV1InputKeysStruct;
FBSDK_EXTERN const FBSDKBridgeAPIProtocolNativeV1InputKeysStruct FBSDKBridgeAPIProtocolNativeV1InputKeys;

typedef struct
{
  __unsafe_unretained NSString *actionID;
  __unsafe_unretained NSString *error;
} FBSDKBridgeAPIProtocolNativeV1BridgeParameterInputKeysStruct;
FBSDK_EXTERN const FBSDKBridgeAPIProtocolNativeV1BridgeParameterInputKeysStruct FBSDKBridgeAPIProtocolNativeV1BridgeParameterInputKeys;

@interface FBSDKBridgeAPIProtocolNativeV1 : NSObject <FBSDKBridgeAPIProtocol>

- (instancetype)initWithAppScheme:(NSString *)appScheme;
- (instancetype)initWithAppScheme:(NSString *)appScheme
                       pasteboard:(UIPasteboard *)pasteboard
              dataLengthThreshold:(NSUInteger)dataLengthThreshold
                   includeAppIcon:(BOOL)includeAppIcon
NS_DESIGNATED_INITIALIZER;

@property (nonatomic, copy, readonly) NSString *appScheme;
@property (nonatomic, assign, readonly) NSUInteger dataLengthThreshold;
@property (nonatomic, assign, readonly) BOOL includeAppIcon;
@property (nonatomic, strong, readonly) UIPasteboard *pasteboard;

@end

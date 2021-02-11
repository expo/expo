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

#import <UIKit/UIKit.h>

#if SWIFT_PACKAGE
#import "FBSDKCoreKit.h"
#else
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#endif

#import "FBSDKBridgeAPIProtocol.h"
#import "FBSDKBridgeAPIProtocolType.h"
#import "FBSDKBridgeAPIRequest.h"
#import "FBSDKBridgeAPIResponse.h"
#import "FBSDKURLOpening.h"

NS_ASSUME_NONNULL_BEGIN

typedef void (^FBSDKBridgeAPIResponseBlock)(FBSDKBridgeAPIResponse *response)
NS_SWIFT_NAME(BridgeAPIResponseBlock);

typedef void (^FBSDKAuthenticationCompletionHandler)(NSURL *_Nullable callbackURL, NSError *_Nullable error);

@interface FBSDKBridgeAPI : NSObject

- (void)openBridgeAPIRequest:(NSObject<FBSDKBridgeAPIRequestProtocol> *)request
     useSafariViewController:(BOOL)useSafariViewController
          fromViewController:(nullable UIViewController *)fromViewController
             completionBlock:(FBSDKBridgeAPIResponseBlock)completionBlock;

- (void)openURLWithSafariViewController:(NSURL *)url
                                 sender:(nullable id<FBSDKURLOpening>)sender
                     fromViewController:(nullable UIViewController *)fromViewController
                                handler:(FBSDKSuccessBlock)handler;

- (void)openURL:(NSURL *)url
         sender:(nullable id<FBSDKURLOpening>)sender
        handler:(FBSDKSuccessBlock)handler;

- (FBSDKAuthenticationCompletionHandler)sessionCompletionHandler;

@property (class, nonatomic, readonly, strong) FBSDKBridgeAPI *sharedInstance
NS_SWIFT_NAME(shared);
@property (nonatomic, readonly, getter=isActive) BOOL active;


@end

NS_ASSUME_NONNULL_END

#endif

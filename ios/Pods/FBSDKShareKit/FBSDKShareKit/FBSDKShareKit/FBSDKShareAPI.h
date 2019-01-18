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

#import <FBSDKCoreKit/FBSDKAccessToken.h>

#import <FBSDKShareKit/FBSDKShareOpenGraphObject.h>
#import <FBSDKShareKit/FBSDKSharing.h>

/**
  A utility class for sharing through the graph API.  Using this class requires an access token that
 has been granted the "publish_actions" permission.

 FBSDKShareAPI network requests are scheduled on the current run loop in the default run loop mode.
 If you want to use FBSDKShareAPI in a background thread, you must manage the run loop
 yourself.
 */
@interface FBSDKShareAPI : NSObject <FBSDKSharing>

/**
  Convenience method to build up a share API with content and a delegate.
 @param content The content to be shared.
 @param delegate The receiver's delegate.
 */
+ (instancetype)shareWithContent:(id<FBSDKSharingContent>)content delegate:(id<FBSDKSharingDelegate>)delegate;

/**
  The message the person has provided through the custom dialog that will accompany the share content.
 */
@property (nonatomic, copy) NSString *message;

/**
  The graph node to which content should be shared.
 */
@property (nonatomic, copy) NSString *graphNode;

/**
  The access token used when performing a share. The access token must have the "publish_actions"
 permission granted.

 Defaults to [FBSDKAccessToken currentAccessToken]. Setting this to nil will revert the access token to
 [FBSDKAccessToken currentAccessToken].
 */
@property (nonatomic, strong) FBSDKAccessToken *accessToken;

/**
  A Boolean value that indicates whether the receiver can send the share.

 May return NO if the appropriate Facebook app is not installed and is required or an access token is
 required but not available.  This method does not validate the content on the receiver, so this can be checked before
 building up the content.

 @see [FBSDKSharing validateWithError:]
 @return YES if the receiver can send, otherwise NO.
 */
@property (nonatomic, readonly) BOOL canShare;

/**
  Creates an User Owned Open Graph object without an action.
 @param openGraphObject The open graph object to create.

 Use this method to create an object alone, when an action is not going to be posted with the object.  If
 the object will be used within an action, just put the object in the action and share that as the shareContent and the
 object will be created in the process.  The delegate will be messaged with the results.

 Also see https://developers.facebook.com/docs/sharing/opengraph/object-api#objectapi-creatinguser

 @return YES if the receiver was able to send the request to create the object, otherwise NO.
 */
- (BOOL)createOpenGraphObject:(FBSDKShareOpenGraphObject *)openGraphObject;

/**
  Begins the send from the receiver.
 @return YES if the receiver was able to send the share, otherwise NO.
 */
- (BOOL)share;

@end

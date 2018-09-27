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

#import <FBSDKShareKit/FBSDKSharingContent.h>

@protocol FBSDKSharingDelegate;

/**
  The common interface for components that initiate sharing.

 @see FBSDKShareDialog

 @see FBSDKMessageDialog

 @see FBSDKShareAPI
 */
@protocol FBSDKSharing <NSObject>

/**
  The receiver's delegate or nil if it doesn't have a delegate.
 */
@property (nonatomic, weak) id<FBSDKSharingDelegate> delegate;

/**
  The content to be shared.
 */
@property (nonatomic, copy) id<FBSDKSharingContent> shareContent;

/**
  A Boolean value that indicates whether the receiver should fail if it finds an error with the share content.

 If NO, the sharer will still be displayed without the data that was mis-configured.  For example, an
 invalid placeID specified on the shareContent would produce a data error.
 */
@property (nonatomic, assign) BOOL shouldFailOnDataError;

/**
  Validates the content on the receiver.
 @param errorRef If an error occurs, upon return contains an NSError object that describes the problem.
 @return YES if the content is valid, otherwise NO.
 */
- (BOOL)validateWithError:(NSError **)errorRef;

@end

/**
  The common interface for dialogs that initiate sharing.
 */
@protocol FBSDKSharingDialog <FBSDKSharing>

/**
  A Boolean value that indicates whether the receiver can initiate a share.

 May return NO if the appropriate Facebook app is not installed and is required or an access token is
 required but not available.  This method does not validate the content on the receiver, so this can be checked before
 building up the content.

 @see [FBSDKSharing validateWithError:]
 @return YES if the receiver can share, otherwise NO.
 */
- (BOOL)canShow;

/**
  Shows the dialog.
 @return YES if the receiver was able to begin sharing, otherwise NO.
 */
- (BOOL)show;

@end

/**
  A delegate for FBSDKSharing.

 The delegate is notified with the results of the sharer as long as the application has permissions to
 receive the information.  For example, if the person is not signed into the containing app, the sharer may not be able
 to distinguish between completion of a share and cancellation.
 */
@protocol FBSDKSharingDelegate <NSObject>

/**
  Sent to the delegate when the share completes without error or cancellation.
 @param sharer The FBSDKSharing that completed.
 @param results The results from the sharer.  This may be nil or empty.
 */
- (void)sharer:(id<FBSDKSharing>)sharer didCompleteWithResults:(NSDictionary *)results;

/**
  Sent to the delegate when the sharer encounters an error.
 @param sharer The FBSDKSharing that completed.
 @param error The error.
 */
- (void)sharer:(id<FBSDKSharing>)sharer didFailWithError:(NSError *)error;

/**
  Sent to the delegate when the sharer is cancelled.
 @param sharer The FBSDKSharing that completed.
 */
- (void)sharerDidCancel:(id<FBSDKSharing>)sharer;

@end

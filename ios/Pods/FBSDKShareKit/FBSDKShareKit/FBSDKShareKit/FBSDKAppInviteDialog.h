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

#import <FBSDKShareKit/FBSDKAppInviteContent.h>

@protocol FBSDKAppInviteDialogDelegate;

/**
 A dialog for sending App Invites.
 */
@interface FBSDKAppInviteDialog : NSObject

/**
 Convenience method to show a FBSDKAppInviteDialog
 @param viewController A UIViewController to present the dialog from.
 @param content The content for the app invite.
 @param delegate The receiver's delegate.
 @warning This method is deprecated.
 */
+ (instancetype)showFromViewController:(UIViewController *)viewController
                           withContent:(FBSDKAppInviteContent *)content
                              delegate:(id<FBSDKAppInviteDialogDelegate>)delegate
DEPRECATED_MSG_ATTRIBUTE("App Invites no longer supported");


/**

 @warning use showFromViewController:withContent:delegate: instead
 */
+ (instancetype)showWithContent:(FBSDKAppInviteContent *)content delegate:(id<FBSDKAppInviteDialogDelegate>)delegate
DEPRECATED_MSG_ATTRIBUTE("use showFromViewController:withContent:delegate: instead");

/**
 A UIViewController to present the dialog from.

 If not specified, the top most view controller will be automatically determined as best as possible.
 */
@property (nonatomic, weak) UIViewController *fromViewController;

/**
 The receiver's delegate or nil if it doesn't have a delegate.
 */
@property (nonatomic, weak) id<FBSDKAppInviteDialogDelegate> delegate;

/**
 The content for app invite.
 */
@property (nonatomic, copy) FBSDKAppInviteContent *content;

/**
 A Boolean value that indicates whether the receiver can initiate an app invite.

 May return NO if the appropriate Facebook app is not installed and is required or an access token is
 required but not available.  This method does not validate the content on the receiver, so this can be checked before
 building up the content.

 @see validateWithError:
 @return YES if the receiver can show the dialog, otherwise NO.
 */
- (BOOL)canShow;

/**
 Begins the app invite from the receiver.
 @return YES if the receiver was able to show the dialog, otherwise NO.
 */
- (BOOL)show;

/**
 Validates the content on the receiver.
 @param errorRef If an error occurs, upon return contains an NSError object that describes the problem.
 @return YES if the content is valid, otherwise NO.
 */
- (BOOL)validateWithError:(NSError *__autoreleasing *)errorRef;

@end

/**
 A delegate for FBSDKAppInviteDialog.

 The delegate is notified with the results of the app invite as long as the application has permissions to
 receive the information.  For example, if the person is not signed into the containing app, the shower may not be able
 to distinguish between completion of an app invite and cancellation.
 */
@protocol FBSDKAppInviteDialogDelegate <NSObject>

/**
 Sent to the delegate when the app invite completes without error.
 @param appInviteDialog The FBSDKAppInviteDialog that completed.
 @param results The results from the dialog.  This may be nil or empty.
 */
- (void)appInviteDialog:(FBSDKAppInviteDialog *)appInviteDialog didCompleteWithResults:(NSDictionary *)results;

/**
 Sent to the delegate when the app invite encounters an error.
 @param appInviteDialog The FBSDKAppInviteDialog that completed.
 @param error The error.
 */
- (void)appInviteDialog:(FBSDKAppInviteDialog *)appInviteDialog didFailWithError:(NSError *)error;

@end

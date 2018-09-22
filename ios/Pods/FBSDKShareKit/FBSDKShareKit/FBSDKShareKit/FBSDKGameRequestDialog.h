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

#import <FBSDKShareKit/FBSDKGameRequestContent.h>

@protocol FBSDKGameRequestDialogDelegate;

/**
  A dialog for sending game requests.
 */
@interface FBSDKGameRequestDialog : NSObject

/**
  Convenience method to build up a game request with content and a delegate.
 - Parameter content: The content for the game request.
 - Parameter delegate: The receiver's delegate.
 */
+ (instancetype)showWithContent:(FBSDKGameRequestContent *)content delegate:(id<FBSDKGameRequestDialogDelegate>)delegate;

/**
  The receiver's delegate or nil if it doesn't have a delegate.
 */
@property (nonatomic, weak) id<FBSDKGameRequestDialogDelegate> delegate;

/**
  The content for game request.
 */
@property (nonatomic, copy) FBSDKGameRequestContent *content;

/**
  Specifies whether frictionless requests are enabled.
 */
@property (nonatomic, assign) BOOL frictionlessRequestsEnabled;

/**
  A Boolean value that indicates whether the receiver can initiate a game request.

 May return NO if the appropriate Facebook app is not installed and is required or an access token is
 required but not available.  This method does not validate the content on the receiver, so this can be checked before
 building up the content.

- See:validateWithError:
 - Returns: YES if the receiver can share, otherwise NO.
 */
- (BOOL)canShow;

/**
  Begins the game request from the receiver.
 - Returns: YES if the receiver was able to show the dialog, otherwise NO.
 */
- (BOOL)show;

/**
  Validates the content on the receiver.
 - Parameter errorRef: If an error occurs, upon return contains an NSError object that describes the problem.
 - Returns: YES if the content is valid, otherwise NO.
 */
- (BOOL)validateWithError:(NSError *__autoreleasing *)errorRef;

@end

/**
  A delegate for FBSDKGameRequestDialog.

 The delegate is notified with the results of the game request as long as the application has permissions to
 receive the information.  For example, if the person is not signed into the containing app, the shower may not be able
 to distinguish between completion of a game request and cancellation.
 */
@protocol FBSDKGameRequestDialogDelegate <NSObject>

/**
  Sent to the delegate when the game request completes without error.
 - Parameter gameRequestDialog: The FBSDKGameRequestDialog that completed.
 - Parameter results: The results from the dialog.  This may be nil or empty.
 */
- (void)gameRequestDialog:(FBSDKGameRequestDialog *)gameRequestDialog didCompleteWithResults:(NSDictionary *)results;

/**
  Sent to the delegate when the game request encounters an error.
 - Parameter gameRequestDialog: The FBSDKGameRequestDialog that completed.
 - Parameter error: The error.
 */
- (void)gameRequestDialog:(FBSDKGameRequestDialog *)gameRequestDialog didFailWithError:(NSError *)error;

/**
  Sent to the delegate when the game request dialog is cancelled.
 - Parameter gameRequestDialog: The FBSDKGameRequestDialog that completed.
 */
- (void)gameRequestDialogDidCancel:(FBSDKGameRequestDialog *)gameRequestDialog;

@end

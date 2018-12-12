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

@protocol FBSDKAppGroupJoinDialogDelegate;

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information.
 */
DEPRECATED_MSG_ATTRIBUTE("App and game groups are being deprecated")
@interface FBSDKAppGroupJoinDialog : NSObject

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information.
 */
+ (instancetype)showWithGroupID:(NSString *)groupID
                       delegate:(id<FBSDKAppGroupJoinDialogDelegate>)delegate DEPRECATED_ATTRIBUTE;

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information. */
@property (nonatomic, weak) id<FBSDKAppGroupJoinDialogDelegate> delegate DEPRECATED_ATTRIBUTE;

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information. */
@property (nonatomic, copy) NSString *groupID DEPRECATED_ATTRIBUTE;

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information.
 */
- (BOOL)canShow DEPRECATED_ATTRIBUTE;

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information.
 */
- (BOOL)show DEPRECATED_ATTRIBUTE;

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information.
 */
- (BOOL)validateWithError:(NSError *__autoreleasing *)errorRef DEPRECATED_ATTRIBUTE;

@end

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information.
 */
DEPRECATED_MSG_ATTRIBUTE("App and game groups are being deprecated")
@protocol FBSDKAppGroupJoinDialogDelegate <NSObject>

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information.
 */
- (void)appGroupJoinDialog:(FBSDKAppGroupJoinDialog *)appGroupJoinDialog didCompleteWithResults:(NSDictionary *)results DEPRECATED_ATTRIBUTE;

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information.
 */
- (void)appGroupJoinDialog:(FBSDKAppGroupJoinDialog *)appGroupJoinDialog didFailWithError:(NSError *)error DEPRECATED_ATTRIBUTE;

/**

@warning App and game groups are being deprecated. See https://developers.facebook.com/docs/games/services/game-groups for more information.
 */
- (void)appGroupJoinDialogDidCancel:(FBSDKAppGroupJoinDialog *)appGroupJoinDialog DEPRECATED_ATTRIBUTE;

@end

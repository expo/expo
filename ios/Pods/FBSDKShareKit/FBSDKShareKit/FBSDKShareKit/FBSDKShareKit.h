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

#import <FBSDKShareKit/FBSDKHashtag.h>
#import <FBSDKShareKit/FBSDKShareAPI.h>
#import <FBSDKShareKit/FBSDKShareConstants.h>
#import <FBSDKShareKit/FBSDKShareLinkContent.h>
#import <FBSDKShareKit/FBSDKShareMediaContent.h>
#import <FBSDKShareKit/FBSDKShareMessengerActionButton.h>
#import <FBSDKShareKit/FBSDKShareMessengerGenericTemplateContent.h>
#import <FBSDKShareKit/FBSDKShareMessengerGenericTemplateElement.h>
#import <FBSDKShareKit/FBSDKShareMessengerMediaTemplateContent.h>
#import <FBSDKShareKit/FBSDKShareMessengerOpenGraphMusicTemplateContent.h>
#import <FBSDKShareKit/FBSDKShareMessengerURLActionButton.h>
#import <FBSDKShareKit/FBSDKShareOpenGraphAction.h>
#import <FBSDKShareKit/FBSDKShareOpenGraphContent.h>
#import <FBSDKShareKit/FBSDKShareOpenGraphObject.h>
#import <FBSDKShareKit/FBSDKSharePhoto.h>
#import <FBSDKShareKit/FBSDKSharePhotoContent.h>
#import <FBSDKShareKit/FBSDKShareVideo.h>
#import <FBSDKShareKit/FBSDKShareVideoContent.h>
#import <FBSDKShareKit/FBSDKSharing.h>
#import <FBSDKShareKit/FBSDKSharingContent.h>

#if !TARGET_OS_TV
#import <FBSDKShareKit/FBSDKAppGroupAddDialog.h>
#import <FBSDKShareKit/FBSDKAppGroupContent.h>
#import <FBSDKShareKit/FBSDKAppGroupJoinDialog.h>
#import <FBSDKShareKit/FBSDKAppInviteContent.h>
#import <FBSDKShareKit/FBSDKAppInviteDialog.h>
#import <FBSDKShareKit/FBSDKGameRequestContent.h>
#import <FBSDKShareKit/FBSDKGameRequestDialog.h>
#import <FBSDKShareKit/FBSDKLikeButton.h>
#import <FBSDKShareKit/FBSDKLikeControl.h>
#import <FBSDKShareKit/FBSDKLikeObjectType.h>
#import <FBSDKShareKit/FBSDKMessageDialog.h>
#import <FBSDKShareKit/FBSDKShareButton.h>
#import <FBSDKShareKit/FBSDKShareCameraEffectContent.h>
#import <FBSDKShareKit/FBSDKShareDialog.h>
#import <FBSDKShareKit/FBSDKShareDialogMode.h>
#import <FBSDKShareKit/FBSDKSendButton.h>
#else
#import <FBSDKShareKit/FBSDKDeviceShareViewController.h>
#import <FBSDKShareKit/FBSDKDeviceShareButton.h>
#endif

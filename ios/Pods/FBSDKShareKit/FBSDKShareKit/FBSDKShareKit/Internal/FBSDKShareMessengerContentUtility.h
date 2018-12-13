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

@class FBSDKShareMessengerURLActionButton;
@protocol FBSDKShareMessengerActionButton;

FOUNDATION_EXPORT NSString *const kFBSDKShareMessengerTemplateTypeKey;
FOUNDATION_EXPORT NSString *const kFBSDKShareMessengerTemplateKey;
FOUNDATION_EXPORT NSString *const kFBSDKShareMessengerPayloadKey;
FOUNDATION_EXPORT NSString *const kFBSDKShareMessengerTypeKey;
FOUNDATION_EXPORT NSString *const kFBSDKShareMessengerAttachmentKey;
FOUNDATION_EXPORT NSString *const kFBSDKShareMessengerElementsKey;
FOUNDATION_EXPORT NSString *const kFBSDKShareMessengerButtonsKey;

void AddToContentPreviewDictionaryForButton(NSMutableDictionary<NSString *, id> *dictionary,
                                            id<FBSDKShareMessengerActionButton> button);

NSDictionary<NSString *, id> *SerializableButtonFromURLButton(FBSDKShareMessengerURLActionButton *button, BOOL isDefaultAction);
NSArray<NSDictionary<NSString *, id> *> *SerializableButtonsFromButton(id<FBSDKShareMessengerActionButton> button);

@interface FBSDKShareMessengerContentUtility : NSObject

+ (void)addToParameters:(NSMutableDictionary<NSString *, id> *)parameters
        contentForShare:(NSMutableDictionary<NSString *, id> *)contentForShare
      contentForPreview:(NSMutableDictionary<NSString *, id> *)contentForPreview;

+ (BOOL)validateMessengerActionButton:(id<FBSDKShareMessengerActionButton>)button
                isDefaultActionButton:(BOOL)isDefaultActionButton
                               pageID:(NSString *)pageID
                                error:(NSError *__autoreleasing *)errorRef;

@end

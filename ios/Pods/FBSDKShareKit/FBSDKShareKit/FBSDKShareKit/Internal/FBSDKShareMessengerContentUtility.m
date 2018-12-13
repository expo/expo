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

#import "FBSDKShareMessengerContentUtility.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareConstants.h"
#import "FBSDKShareMessengerGenericTemplateContent.h"
#import "FBSDKShareMessengerGenericTemplateElement.h"
#import "FBSDKShareMessengerMediaTemplateContent.h"
#import "FBSDKShareMessengerOpenGraphMusicTemplateContent.h"
#import "FBSDKShareMessengerURLActionButton.h"
#import "FBSDKShareUtility.h"

NSString *const kFBSDKShareMessengerTemplateTypeKey = @"template_type";
NSString *const kFBSDKShareMessengerTemplateKey = @"template";
NSString *const kFBSDKShareMessengerPayloadKey = @"payload";
NSString *const kFBSDKShareMessengerTypeKey = @"type";
NSString *const kFBSDKShareMessengerAttachmentKey = @"attachment";
NSString *const kFBSDKShareMessengerElementsKey = @"elements";
NSString *const kFBSDKShareMessengerButtonsKey = @"buttons";

static void _AddToContentPreviewDictionaryForURLButton(NSMutableDictionary<NSString *, id> *dictionary,
                                                       FBSDKShareMessengerURLActionButton *urlButton)
{
  NSString *urlString = urlButton.url.absoluteString;
  NSString *urlStringPath = urlButton.url.path;
  NSRange rangeOfPath = [urlString rangeOfString:urlStringPath];
  NSString *shortURLString = urlString;
  if (rangeOfPath.location != NSNotFound) {
    shortURLString = [urlString substringWithRange:NSMakeRange(0, rangeOfPath.location)];
  }

  NSString *previewString = urlButton.title.length > 0 ? [NSString stringWithFormat:@"%@ - %@", urlButton.title, shortURLString] : shortURLString;
  [FBSDKInternalUtility dictionary:dictionary setObject:previewString forKey:@"target_display"];
  [FBSDKInternalUtility dictionary:dictionary setObject:urlButton.url.absoluteString forKey:@"item_url"];
}

void AddToContentPreviewDictionaryForButton(NSMutableDictionary<NSString *, id> *dictionary,
                                            id<FBSDKShareMessengerActionButton> button)
{
  if ([button isKindOfClass:[FBSDKShareMessengerURLActionButton class]]) {
    _AddToContentPreviewDictionaryForURLButton(dictionary, button);
  }
}

@implementation FBSDKShareMessengerContentUtility

static NSString *_WebviewHeightRatioString(FBSDKShareMessengerURLActionButtonWebviewHeightRatio heightRatio) {
  switch (heightRatio) {
    case FBSDKShareMessengerURLActionButtonWebviewHeightRatioFull:
      return @"full";
    case FBSDKShareMessengerURLActionButtonWebviewHeightRatioTall:
      return @"tall";
    case FBSDKShareMessengerURLActionButtonWebviewHeightRatioCompact:
      return @"compact";
  }
}

static NSString *_WebviewShareButtonString(BOOL shouldHideWebviewShareButton) {
  return shouldHideWebviewShareButton ? @"hide" : nil;
}

NSDictionary<NSString *, id> *SerializableButtonFromURLButton(FBSDKShareMessengerURLActionButton *button, BOOL isDefaultAction)
{
  NSMutableDictionary *serializableButton = [NSMutableDictionary dictionary];

  // Strip out title for default action
  if (!isDefaultAction) {
    [FBSDKInternalUtility dictionary:serializableButton setObject:button.title forKey:@"title"];
  }

  [FBSDKInternalUtility dictionary:serializableButton setObject:@"web_url" forKey:@"type"];
  [FBSDKInternalUtility dictionary:serializableButton setObject:button.url.absoluteString forKey:@"url"];
  [FBSDKInternalUtility dictionary:serializableButton setObject:_WebviewHeightRatioString(button.webviewHeightRatio) forKey:@"webview_height_ratio"];
  [FBSDKInternalUtility dictionary:serializableButton setObject:@(button.isMessengerExtensionURL) forKey:@"messenger_extensions"];
  [FBSDKInternalUtility dictionary:serializableButton setObject:button.fallbackURL.absoluteString forKey:@"fallback_url"];
  [FBSDKInternalUtility dictionary:serializableButton setObject:_WebviewShareButtonString(button.shouldHideWebviewShareButton) forKey:@"webview_share_button"];
  return serializableButton;
}

NSArray<NSDictionary<NSString *, id> *> *SerializableButtonsFromButton(id<FBSDKShareMessengerActionButton> button)
{
  // Return NSArray even though there is just one button to match proper json structure
  NSMutableArray<NSDictionary<NSString *, id> *> *serializableButtons = [NSMutableArray array];
  if ([button isKindOfClass:[FBSDKShareMessengerURLActionButton class]]) {
    [FBSDKInternalUtility array:serializableButtons addObject:SerializableButtonFromURLButton(button, NO)];
  }

  return serializableButtons;
}

+ (void)addToParameters:(NSMutableDictionary<NSString *, id> *)parameters
        contentForShare:(NSMutableDictionary<NSString *, id> *)contentForShare
      contentForPreview:(NSMutableDictionary<NSString *, id> *)contentForPreview
{
  NSError *error = nil;
  NSData *contentForShareData = [NSJSONSerialization dataWithJSONObject:contentForShare options:kNilOptions error:&error];
  if (!error && contentForShareData) {
    NSString *contentForShareDataString = [[NSString alloc] initWithData:contentForShareData encoding:NSUTF8StringEncoding];

    NSMutableDictionary<NSString *, id> *messengerShareContent = [NSMutableDictionary dictionary];
    [FBSDKInternalUtility dictionary:messengerShareContent setObject:contentForShareDataString forKey:@"content_for_share"];
    [FBSDKInternalUtility dictionary:messengerShareContent setObject:contentForPreview forKey:@"content_for_preview"];
    [FBSDKInternalUtility dictionary:parameters setObject:messengerShareContent forKey:@"messenger_share_content"];
  }
}

+ (BOOL)validateMessengerActionButton:(id<FBSDKShareMessengerActionButton>)button
                isDefaultActionButton:(BOOL)isDefaultActionButton
                               pageID:(NSString *)pageID
                                error:(NSError *__autoreleasing *)errorRef
{
  if (!button) {
    return YES;
  }
  else if ([button isKindOfClass:[FBSDKShareMessengerURLActionButton class]]) {
    FBSDKShareMessengerURLActionButton *urlActionButton = (FBSDKShareMessengerURLActionButton *)button;
    return [FBSDKShareUtility validateRequiredValue:urlActionButton.url name:@"button.url" error:errorRef] &&
    (!isDefaultActionButton ? [FBSDKShareUtility validateRequiredValue:urlActionButton.title name:@"button.title" error:errorRef] : YES) &&
    (urlActionButton.isMessengerExtensionURL ? [FBSDKShareUtility validateRequiredValue:pageID name:@"content pageID" error:errorRef] : YES);
  } else {
    if (errorRef != NULL) {
      *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                       name:@"buttons"
                                                      value:button
                                                    message:nil];
    }
    return NO;
  }
}

@end

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
#import "FBSDKShareMessengerGenericTemplateContent.h"
#import "FBSDKShareMessengerGenericTemplateElement.h"
#import "FBSDKShareMessengerMediaTemplateContent.h"
#import "FBSDKShareMessengerOpenGraphMusicTemplateContent.h"
#import "FBSDKShareMessengerURLActionButton.h"

static NSString *const kTemplateTypeKey = @"template_type";
static NSString *const kTemplateKey = @"template";
static NSString *const kPayloadKey = @"payload";
static NSString *const kTypeKey = @"type";
static NSString *const kAttachmentKey = @"attachment";
static NSString *const kElementsKey = @"elements";
static NSString *const kButtonsKey = @"buttons";

@implementation FBSDKShareMessengerContentUtility

static BOOL _URLHasFacebookDomain(NSURL *URL)
{
  NSString *urlHost = [URL.host lowercaseString];
  NSArray<NSString *> *pathComponents = [URL pathComponents];

  /**
   Check the following three different cases...
   1. Check if host is facebook.com, such as in 'https://facebok.com/test'
   2. Check if host is someprefix.facebook.com, such as in 'https://www.facebook.com/test'
   3. Check if host is null, but the first path component is facebook.com
   */
  return [urlHost isEqualToString:@"facebook.com"] ||
  [urlHost hasSuffix:@".facebook.com"] ||
  ([[[pathComponents firstObject] lowercaseString] hasSuffix:@"facebook.com"]);
}

static void _AddToContentPreviewDictionaryForURLButton(NSMutableDictionary *dictionary,
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

static void _AddToContentPreviewDictionaryForButton(NSMutableDictionary *dictionary,
                                                    id<FBSDKShareMessengerActionButton> button)
{
  if ([button isKindOfClass:[FBSDKShareMessengerURLActionButton class]]) {
    _AddToContentPreviewDictionaryForURLButton(dictionary, button);
  }
}

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

static NSString *_MediaTypeString(FBSDKShareMessengerMediaTemplateMediaType mediaType)
{
  switch (mediaType) {
    case FBSDKShareMessengerMediaTemplateMediaTypeImage:
      return @"image";
    case FBSDKShareMessengerMediaTemplateMediaTypeVideo:
      return @"video";
  }
}

static NSString *_WebviewShareButtonString(BOOL shouldHideWebviewShareButton) {
  return shouldHideWebviewShareButton ? @"hide" : nil;
}

static NSString *_ImageAspectRatioString(FBSDKShareMessengerGenericTemplateImageAspectRatio imageAspectRatio)
{
  switch (imageAspectRatio) {
    case FBSDKShareMessengerGenericTemplateImageAspectRatioSquare:
      return @"square";
    case FBSDKShareMessengerGenericTemplateImageAspectRatioHorizontal:
      return @"horizontal";
  }
}

static NSDictionary *_SerializableButtonFromURLButton(FBSDKShareMessengerURLActionButton *button, BOOL isDefaultAction)
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

static NSArray *_SerializableButtonsFromButton(id<FBSDKShareMessengerActionButton> button)
{
  // Return NSArray even though there is just one button to match proper json structure
  NSMutableArray *serializableButtons = [NSMutableArray array];
  if ([button isKindOfClass:[FBSDKShareMessengerURLActionButton class]]) {
    [FBSDKInternalUtility array:serializableButtons addObject:_SerializableButtonFromURLButton(button, NO)];
  }

  return serializableButtons;
}

static NSArray *_SerializableGenericTemplateElementsFromElements(NSArray<FBSDKShareMessengerGenericTemplateElement *> *elements)
{
  NSMutableArray *serializableElements = [NSMutableArray array];
  for (FBSDKShareMessengerGenericTemplateElement *element in elements) {
    NSMutableDictionary *elementDictionary = [NSMutableDictionary dictionary];
    [FBSDKInternalUtility dictionary:elementDictionary setObject:element.title forKey:@"title"];
    [FBSDKInternalUtility dictionary:elementDictionary setObject:element.subtitle forKey:@"subtitle"];
    [FBSDKInternalUtility dictionary:elementDictionary setObject:element.imageURL.absoluteString forKey:@"image_url"];
    [FBSDKInternalUtility dictionary:elementDictionary setObject:_SerializableButtonsFromButton(element.button) forKey:kButtonsKey];
    if ([element.defaultAction isKindOfClass:[FBSDKShareMessengerURLActionButton class]]) {
      [FBSDKInternalUtility dictionary:elementDictionary setObject:_SerializableButtonFromURLButton(element.defaultAction, YES) forKey:@"default_action"];
    }

    [serializableElements addObject:elementDictionary];
  }

  return serializableElements;
}

static NSArray *_SerializableMediaTemplateContentFromContent(FBSDKShareMessengerMediaTemplateContent *mediaTemplateContent)
{
  NSMutableArray *serializableMediaTemplateContent = [NSMutableArray array];

  NSMutableDictionary *mediaTemplateContentDictionary = [NSMutableDictionary dictionary];
  [FBSDKInternalUtility dictionary:mediaTemplateContentDictionary setObject:_MediaTypeString(mediaTemplateContent.mediaType) forKey:@"media_type"];
  [FBSDKInternalUtility dictionary:mediaTemplateContentDictionary setObject:mediaTemplateContent.mediaURL.absoluteString forKey:@"url"];
  [FBSDKInternalUtility dictionary:mediaTemplateContentDictionary setObject:mediaTemplateContent.attachmentID forKey:@"attachment_id"];
  [FBSDKInternalUtility dictionary:mediaTemplateContentDictionary setObject:_SerializableButtonsFromButton(mediaTemplateContent.button) forKey:kButtonsKey];
  [serializableMediaTemplateContent addObject:mediaTemplateContentDictionary];

  return serializableMediaTemplateContent;
}

static NSArray *_SerializableOpenGraphMusicTemplateContentFromContent(FBSDKShareMessengerOpenGraphMusicTemplateContent *openGraphMusicTemplateContent)
{
  NSMutableArray *serializableOpenGraphMusicTemplateContent = [NSMutableArray array];

  NSMutableDictionary *openGraphMusicTemplateContentDictionary = [NSMutableDictionary dictionary];
  [FBSDKInternalUtility dictionary:openGraphMusicTemplateContentDictionary setObject:openGraphMusicTemplateContent.url.absoluteString forKey:@"url"];
  [FBSDKInternalUtility dictionary:openGraphMusicTemplateContentDictionary setObject:_SerializableButtonsFromButton(openGraphMusicTemplateContent.button) forKey:kButtonsKey];
  [serializableOpenGraphMusicTemplateContent addObject:openGraphMusicTemplateContentDictionary];

  return serializableOpenGraphMusicTemplateContent;
}

static NSString *_MediaTemplateURLSerializationKey(NSURL *mediaURL)
{
  if (_URLHasFacebookDomain(mediaURL)) {
    return @"facebook_media_url";
  } else {
    return @"image_url";
  }
}

+ (void)_addToParameters:(NSMutableDictionary *)parameters
         contentForShare:(NSMutableDictionary *)contentForShare
       contentForPreview:(NSMutableDictionary *)contentForPreview
{
  NSError *error = nil;
  NSData *contentForShareData = [NSJSONSerialization dataWithJSONObject:contentForShare options:kNilOptions error:&error];
  if (!error && contentForShareData) {
    NSString *contentForShareDataString = [[NSString alloc] initWithData:contentForShareData encoding:NSUTF8StringEncoding];

    NSMutableDictionary *messengerShareContent = [NSMutableDictionary dictionary];
    [FBSDKInternalUtility dictionary:messengerShareContent setObject:contentForShareDataString forKey:@"content_for_share"];
    [FBSDKInternalUtility dictionary:messengerShareContent setObject:contentForPreview forKey:@"content_for_preview"];
    [FBSDKInternalUtility dictionary:parameters setObject:messengerShareContent forKey:@"messenger_share_content"];
  }
}

+ (void)addToParameters:(NSMutableDictionary *)parameters
forShareMessengerGenericTemplateContent:(FBSDKShareMessengerGenericTemplateContent *)genericTemplateContent
{
  NSMutableDictionary *payload = [NSMutableDictionary dictionary];
  [payload setObject:@"generic" forKey:kTemplateTypeKey];
  [payload setObject:@(genericTemplateContent.isSharable) forKey:@"sharable"];
  [payload setObject:_ImageAspectRatioString(genericTemplateContent.imageAspectRatio) forKey:@"image_aspect_ratio"];
  [payload setObject:_SerializableGenericTemplateElementsFromElements(@[genericTemplateContent.element]) forKey:kElementsKey];

  NSMutableDictionary *attachment = [NSMutableDictionary dictionary];
  [attachment setObject:kTemplateKey forKey:kTypeKey];
  [attachment setObject:payload forKey:kPayloadKey];

  NSMutableDictionary *contentForShare = [NSMutableDictionary dictionary];
  [contentForShare setObject:attachment forKey:kAttachmentKey];

  FBSDKShareMessengerGenericTemplateElement *firstElement = genericTemplateContent.element;
  NSMutableDictionary *contentForPreview = [NSMutableDictionary dictionary];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:@"DEFAULT" forKey:@"preview_type"];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:firstElement.title forKey:@"title"];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:firstElement.subtitle forKey:@"subtitle"];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:firstElement.imageURL.absoluteString forKey:@"image_url"];
  if (firstElement.button) {
    _AddToContentPreviewDictionaryForButton(contentForPreview, firstElement.button);
  } else {
    _AddToContentPreviewDictionaryForButton(contentForPreview, firstElement.defaultAction);
  }

  [self _addToParameters:parameters contentForShare:contentForShare contentForPreview:contentForPreview];
}

+ (void)addToParameters:(NSMutableDictionary *)parameters
forShareMessengerMediaTemplateContent:(FBSDKShareMessengerMediaTemplateContent *)mediaTemplateContent
{
  NSMutableDictionary *payload = [NSMutableDictionary dictionary];
  [payload setObject:@"media" forKey:kTemplateTypeKey];
  [payload setObject:_SerializableMediaTemplateContentFromContent(mediaTemplateContent) forKey:kElementsKey];

  NSMutableDictionary *attachment = [NSMutableDictionary dictionary];
  [attachment setObject:kTemplateKey forKey:kTypeKey];
  [attachment setObject:payload forKey:kPayloadKey];

  NSMutableDictionary *contentForShare = [NSMutableDictionary dictionary];
  [contentForShare setObject:attachment forKey:kAttachmentKey];

  NSMutableDictionary *contentForPreview = [NSMutableDictionary dictionary];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:@"DEFAULT" forKey:@"preview_type"];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:mediaTemplateContent.attachmentID forKey:@"attachment_id"];
  [FBSDKInternalUtility dictionary:contentForPreview
                         setObject:mediaTemplateContent.mediaURL.absoluteString
                            forKey:_MediaTemplateURLSerializationKey(mediaTemplateContent.mediaURL)];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:_MediaTypeString(mediaTemplateContent.mediaType) forKey:@"media_type"];
  _AddToContentPreviewDictionaryForButton(contentForPreview, mediaTemplateContent.button);

  [self _addToParameters:parameters contentForShare:contentForShare contentForPreview:contentForPreview];
}

+ (void)addToParameters:(NSMutableDictionary *)parameters
forShareMessengerOpenGraphMusicTemplateContent:(FBSDKShareMessengerOpenGraphMusicTemplateContent *)openGraphMusicTemplate
{
  NSMutableDictionary *payload = [NSMutableDictionary dictionary];
  [payload setObject:@"open_graph" forKey:kTemplateTypeKey];
  [payload setObject:_SerializableOpenGraphMusicTemplateContentFromContent(openGraphMusicTemplate) forKey:kElementsKey];

  NSMutableDictionary *attachment = [NSMutableDictionary dictionary];
  [attachment setObject:kTemplateKey forKey:kTypeKey];
  [attachment setObject:payload forKey:kPayloadKey];

  NSMutableDictionary *contentForShare = [NSMutableDictionary dictionary];
  [contentForShare setObject:attachment forKey:kAttachmentKey];

  NSMutableDictionary *contentForPreview = [NSMutableDictionary dictionary];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:@"OPEN_GRAPH" forKey:@"preview_type"];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:openGraphMusicTemplate.url.absoluteString forKey:@"open_graph_url"];
  _AddToContentPreviewDictionaryForButton(contentForPreview, openGraphMusicTemplate.button);

  [self _addToParameters:parameters contentForShare:contentForShare contentForPreview:contentForPreview];
}

@end

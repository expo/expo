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

#import "FBSDKGameRequestDialog.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKGameRequestFrictionlessRecipientCache.h"
#import "FBSDKShareConstants.h"
#import "FBSDKShareUtility.h"

@interface FBSDKGameRequestDialog () <FBSDKWebDialogDelegate>
@end

@implementation FBSDKGameRequestDialog
{
  BOOL _dialogIsFrictionless;
  FBSDKWebDialog *_webDialog;
}

#define FBSDK_APP_REQUEST_METHOD_NAME @"apprequests"

#pragma mark - Class Methods

static FBSDKGameRequestFrictionlessRecipientCache *_recipientCache = nil;

+ (void)initialize
{
  if (self == [FBSDKGameRequestDialog class]) {
    _recipientCache = [[FBSDKGameRequestFrictionlessRecipientCache alloc] init];
  }
}

+ (instancetype)showWithContent:(FBSDKGameRequestContent *)content delegate:(id<FBSDKGameRequestDialogDelegate>)delegate
{
  FBSDKGameRequestDialog *dialog = [[self alloc] init];
  dialog.content = content;
  dialog.delegate = delegate;
  [dialog show];
  return dialog;
}

#pragma mark - Object Lifecycle

- (instancetype)init
{
  if ((self = [super init])) {
    _webDialog = [[FBSDKWebDialog alloc] init];
    _webDialog.delegate = self;
    _webDialog.name = FBSDK_APP_REQUEST_METHOD_NAME;
  }
  return self;
}

- (void)dealloc
{
  _webDialog.delegate = nil;
}

#pragma mark - Public Methods

- (BOOL)canShow
{
  return YES;
}

- (BOOL)show
{
  NSError *error;
  if (!self.canShow) {
    error = [NSError fbErrorWithDomain:FBSDKShareErrorDomain
                                  code:FBSDKShareErrorDialogNotAvailable
                               message:@"Game request dialog is not available."];
    [_delegate gameRequestDialog:self didFailWithError:error];
    return NO;
  }
  if (![self validateWithError:&error]) {
    [_delegate gameRequestDialog:self didFailWithError:error];
    return NO;
  }

  FBSDKGameRequestContent *content = self.content;

  if (error) {
    return NO;
  }

  NSMutableDictionary *parameters = [[NSMutableDictionary alloc] init];
  [FBSDKInternalUtility dictionary:parameters setObject:[content.recipients componentsJoinedByString:@","] forKey:@"to"];
  [FBSDKInternalUtility dictionary:parameters setObject:content.message forKey:@"message"];
  [FBSDKInternalUtility dictionary:parameters setObject:[self _actionTypeNameForActionType:content.actionType] forKey:@"action_type"];
  [FBSDKInternalUtility dictionary:parameters setObject:content.objectID forKey:@"object_id"];
  [FBSDKInternalUtility dictionary:parameters setObject:[self _filtersNameForFilters:content.filters] forKey:@"filters"];
  [FBSDKInternalUtility dictionary:parameters setObject:[content.recipientSuggestions componentsJoinedByString:@","] forKey:@"suggestions"];
  [FBSDKInternalUtility dictionary:parameters setObject:content.data forKey:@"data"];
  [FBSDKInternalUtility dictionary:parameters setObject:content.title forKey:@"title"];

  // check if we are sending to a specific set of recipients.  if we are and they are all frictionless recipients, we
  // can perform this action without displaying the web dialog
  _webDialog.deferVisibility = NO;
  NSArray *recipients = content.recipients;
  if (_frictionlessRequestsEnabled && recipients) {
    // specify these parameters to get the frictionless recipients from the dialog when it is presented
    parameters[@"frictionless"] = @YES;
    parameters[@"get_frictionless_recipients"] = @YES;

    _dialogIsFrictionless = YES;
    if ([_recipientCache recipientsAreFrictionless:recipients]) {
      _webDialog.deferVisibility = YES;
    }
  }

  _webDialog.parameters = parameters;
  [_webDialog show];
  [FBSDKInternalUtility registerTransientObject:self];
  return YES;
}

- (BOOL)validateWithError:(NSError *__autoreleasing *)errorRef
{
  if (![FBSDKShareUtility validateRequiredValue:self.content name:@"content" error:errorRef]) {
    return NO;
  }
  if ([self.content respondsToSelector:@selector(validateWithOptions:error:)]) {
    return [self.content validateWithOptions:FBSDKShareBridgeOptionsDefault error:errorRef];
  }
  if (errorRef != NULL) {
    *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                     name:@"content"
                                                    value:self.content
                                                  message:nil];
  }
  return NO;
}

#pragma mark - FBSDKWebDialogDelegate

- (void)webDialog:(FBSDKWebDialog *)webDialog didCompleteWithResults:(NSDictionary *)results
{
  if (_webDialog != webDialog) {
    return;
  }
  if (_dialogIsFrictionless && results) {
    [_recipientCache updateWithResults:results];
  }
  [self _cleanUp];

  NSError *error = [NSError fbErrorWithCode:[FBSDKTypeUtility unsignedIntegerValue:results[@"error_code"]]
                                    message:[FBSDKTypeUtility stringValue:results[@"error_message"]]];
  if (!error.code) {
    // reformat "to[x]" keys into an array.
    int counter = 0;
    NSMutableArray *toArray = [NSMutableArray array];
    while (true) {
      NSString *key = [NSString stringWithFormat:@"to[%d]", counter++];
      if (results[key]) {
        [toArray addObject:results[key]];
      } else {
        break;
      }
    }
    if (toArray.count) {
      NSMutableDictionary *mutableResults = [results mutableCopy];
      mutableResults[@"to"] = toArray;
      results = mutableResults;
    }
  }
  [self _handleCompletionWithDialogResults:results error:error];
  [FBSDKInternalUtility unregisterTransientObject:self];
}

- (void)webDialog:(FBSDKWebDialog *)webDialog didFailWithError:(NSError *)error
{
  if (_webDialog != webDialog) {
    return;
  }
  [self _cleanUp];
  [self _handleCompletionWithDialogResults:nil error:error];
  [FBSDKInternalUtility unregisterTransientObject:self];
}

- (void)webDialogDidCancel:(FBSDKWebDialog *)webDialog
{
  if (_webDialog != webDialog) {
    return;
  }
  [self _cleanUp];
  [_delegate gameRequestDialogDidCancel:self];
  [FBSDKInternalUtility unregisterTransientObject:self];
}

#pragma mark - Helper Methods

- (void)_cleanUp
{
  _dialogIsFrictionless = NO;
}

- (void)_handleCompletionWithDialogResults:(NSDictionary *)results error:(NSError *)error
{
  if (!_delegate) {
    return;
  }
  switch (error.code) {
    case 0:{
      [_delegate gameRequestDialog:self didCompleteWithResults:results];
      break;
    }
    case 4201:{
      [_delegate gameRequestDialogDidCancel:self];
      break;
    }
    default:{
      [_delegate gameRequestDialog:self didFailWithError:error];
      break;
    }
  }
  if (error) {
    return;
  } else {
  }
}

- (NSString *)_actionTypeNameForActionType:(FBSDKGameRequestActionType)actionType
{
  switch (actionType) {
    case FBSDKGameRequestActionTypeNone:{
      return nil;
    }
    case FBSDKGameRequestActionTypeSend:{
      return @"send";
    }
    case FBSDKGameRequestActionTypeAskFor:{
      return @"askfor";
    }
    case FBSDKGameRequestActionTypeTurn:{
      return @"turn";
    }
    default:{
      return nil;
    }
  }
}

- (NSString *)_filtersNameForFilters:(FBSDKGameRequestFilter)filters
{
  switch (filters) {
    case FBSDKGameRequestFilterNone:{
      return nil;
    }
    case FBSDKGameRequestFilterAppUsers:{
      return @"app_users";
    }
    case FBSDKGameRequestFilterAppNonUsers:{
      return @"app_non_users";
    }
    default:{
      return nil;
    }
  }
}

@end

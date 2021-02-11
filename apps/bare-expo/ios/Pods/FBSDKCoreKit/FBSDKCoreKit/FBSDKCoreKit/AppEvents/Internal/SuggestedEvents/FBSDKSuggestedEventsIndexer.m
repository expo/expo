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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKSuggestedEventsIndexer.h"

 #import <UIKit/UIKit.h>

 #import <objc/runtime.h>
 #import <sys/sysctl.h>
 #import <sys/utsname.h>

 #import "FBSDKCoreKit+Internal.h"
 #import "FBSDKFeatureExtractor.h"
 #import "FBSDKMLMacros.h"
 #import "FBSDKModelManager.h"
 #import "FBSDKModelUtility.h"

NSString *const OptInEvents = @"production_events";
NSString *const UnconfirmedEvents = @"eligible_for_prediction_events";

static NSMutableSet<NSString *> *_optInEvents;
static NSMutableSet<NSString *> *_unconfirmedEvents;

@implementation FBSDKSuggestedEventsIndexer

+ (void)initialize
{
  _optInEvents = [NSMutableSet set];
  _unconfirmedEvents = [NSMutableSet set];
}

+ (void)enable
{
  [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:^(FBSDKServerConfiguration *serverConfiguration, NSError *error) {
    if (error) {
      return;
    }

    NSDictionary<NSString *, id> *suggestedEventsSetting = serverConfiguration.suggestedEventsSetting;
    if ([suggestedEventsSetting isKindOfClass:[NSNull class]] || !suggestedEventsSetting[OptInEvents] || !suggestedEventsSetting[UnconfirmedEvents]) {
      return;
    }

    [_optInEvents addObjectsFromArray:suggestedEventsSetting[OptInEvents]];
    [_unconfirmedEvents addObjectsFromArray:suggestedEventsSetting[UnconfirmedEvents]];

    [FBSDKSuggestedEventsIndexer setup];
  }];
}

+ (void)setup
{
  // won't do the model prediction when there is no opt-in event and unconfirmed event
  if (_optInEvents.count == 0 && _unconfirmedEvents.count == 0) {
    return;
  }

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // swizzle UIButton
    [FBSDKSwizzler swizzleSelector:@selector(didMoveToWindow) onClass:[UIControl class] withBlock:^(UIControl *control) {
                                                                                          if (control.window && [control isKindOfClass:[UIButton class]]) {
                                                                                            [((UIButton *)control) addTarget:self action:@selector(buttonClicked:) forControlEvents:UIControlEventTouchDown];
                                                                                          }
                                                                                        } named:@"suggested_events"];

    // UITableView
    void (^tableViewBlock)(UITableView *tableView,
                           SEL cmd,
                           id<UITableViewDelegate> delegate) =
    ^(UITableView *tableView, SEL cmd, id<UITableViewDelegate> delegate) {
      [self handleView:tableView withDelegate:delegate];
    };
    [FBSDKSwizzler swizzleSelector:@selector(setDelegate:)
                           onClass:[UITableView class]
                         withBlock:tableViewBlock
                             named:@"suggested_events"];

    // UICollectionView
    void (^collectionViewBlock)(UICollectionView *collectionView,
                                SEL cmd,
                                id<UICollectionViewDelegate> delegate) =
    ^(UICollectionView *collectionView, SEL cmd, id<UICollectionViewDelegate> delegate) {
      [self handleView:collectionView withDelegate:delegate];
    };
    [FBSDKSwizzler swizzleSelector:@selector(setDelegate:)
                           onClass:[UICollectionView class]
                         withBlock:collectionViewBlock
                             named:@"suggested_events"];

    fb_dispatch_on_main_thread(^{
      [self rematchBindings];
    });
  });
}

+ (void)rematchBindings
{
  NSArray *windows = [UIApplication sharedApplication].windows;
  for (UIWindow *window in windows) {
    [self matchSubviewsIn:window];
  }
}

+ (void)matchSubviewsIn:(UIView *)view
{
  if (!view) {
    return;
  }

  for (UIView *subview in view.subviews) {
    if ([subview isKindOfClass:[UITableView class]]) {
      UITableView *tableView = (UITableView *)subview;
      [self handleView:tableView withDelegate:tableView.delegate];
    } else if ([subview isKindOfClass:[UICollectionView class]]) {
      UICollectionView *collectionView = (UICollectionView *)subview;
      [self handleView:collectionView withDelegate:collectionView.delegate];
    } else if ([subview isKindOfClass:[UIButton class]]) {
      [(UIButton *)subview addTarget:self action:@selector(buttonClicked:) forControlEvents:UIControlEventTouchDown];
    }

    if (![subview isKindOfClass:[UIControl class]]) {
      [self matchSubviewsIn:subview];
    }
  }
}

+ (void)buttonClicked:(UIButton *)button
{
  [self predictEventWithUIResponder:button
                               text:[FBSDKViewHierarchy getText:button]];
}

+ (void)handleView:(UIView *)view withDelegate:(id)delegate
{
  if (!delegate) {
    return;
  }

  if ([view isKindOfClass:[UITableView class]]
      && [delegate respondsToSelector:@selector(tableView:didSelectRowAtIndexPath:)]) {
    void (^block)(id, SEL, id, id) = ^(id target, SEL command, UITableView *tableView, NSIndexPath *indexPath) {
      UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
      [self predictEventWithUIResponder:cell
                                   text:[self getTextFromContentView:[cell contentView]]];
    };
    [FBSDKSwizzler swizzleSelector:@selector(tableView:didSelectRowAtIndexPath:)
                           onClass:[delegate class]
                         withBlock:block
                             named:@"suggested_events"];
  } else if ([view isKindOfClass:[UICollectionView class]]
             && [delegate respondsToSelector:@selector(collectionView:didSelectItemAtIndexPath:)]) {
    void (^block)(id, SEL, id, id) = ^(id target, SEL command, UICollectionView *collectionView, NSIndexPath *indexPath) {
      UICollectionViewCell *cell = [collectionView cellForItemAtIndexPath:indexPath];
      [self predictEventWithUIResponder:cell
                                   text:[self getTextFromContentView:[cell contentView]]];
    };
    [FBSDKSwizzler swizzleSelector:@selector(collectionView:didSelectItemAtIndexPath:)
                           onClass:[delegate class]
                         withBlock:block
                             named:@"suggested_events"];
  }
}

+ (void)predictEventWithUIResponder:(UIResponder *)uiResponder text:(NSString *)text
{
  if (text.length > 100 || text.length == 0 || [FBSDKAppEventsUtility isSensitiveUserData:text]) {
    return;
  }

  NSMutableArray<NSDictionary<NSString *, id> *> *trees = [NSMutableArray array];

  fb_dispatch_on_main_thread(^{
    NSMutableSet<NSObject *> *objAddressSet = [NSMutableSet set];
    NSArray<UIWindow *> *windows = [UIApplication sharedApplication].windows;
    for (UIWindow *window in windows) {
      NSDictionary<NSString *, id> *tree = [FBSDKViewHierarchy recursiveCaptureTreeWithCurrentNode:window
                                                                                        targetNode:uiResponder
                                                                                     objAddressSet:objAddressSet
                                                                                              hash:NO];
      if (tree) {
        if (window.isKeyWindow) {
          [trees insertObject:tree atIndex:0];
        } else {
          [FBSDKTypeUtility array:trees addObject:tree];
        }
      }
    }
    NSMutableDictionary<NSString *, id> *viewTree = [NSMutableDictionary dictionary];

    NSString *screenName = nil;
    UIViewController *topMostViewController = [FBSDKInternalUtility topMostViewController];
    if (topMostViewController) {
      screenName = NSStringFromClass([topMostViewController class]);
    }

    [FBSDKTypeUtility dictionary:viewTree setObject:trees forKey:VIEW_HIERARCHY_VIEW_KEY];
    [FBSDKTypeUtility dictionary:viewTree setObject:screenName ?: @"" forKey:VIEW_HIERARCHY_SCREEN_NAME_KEY];

    fb_dispatch_on_default_thread(^{
      NSMutableDictionary<NSString *, id> *viewTreeCopy = [viewTree mutableCopy];
      float *denseData = [FBSDKFeatureExtractor getDenseFeatures:viewTree];
      NSString *textFeature = [FBSDKModelUtility normalizeText:[FBSDKFeatureExtractor getTextFeature:text withScreenName:viewTreeCopy[@"screenname"]]];
      NSString *event = [FBSDKModelManager processSuggestedEvents:textFeature denseData:denseData];
      if (!event || [event isEqualToString:SUGGESTED_EVENT_OTHER]) {
        return;
      }
      if ([_optInEvents containsObject:event]) {
        [FBSDKAppEvents logEvent:event
                      parameters:@{@"_is_suggested_event" : @"1",
                                   @"_button_text" : text}];
      } else if ([_unconfirmedEvents containsObject:event]) {
        // Only send back not confirmed events to advertisers
        [self logSuggestedEvent:event withText:text withDenseFeature:[self getDenseFeaure:denseData] ?: @""];
      }
      free(denseData);
    });
  });
}

 #pragma mark - Helper Methods

+ (NSString *)getDenseFeaure:(float *)denseData
{
  // Get dense feature string
  NSMutableArray *denseDataArray = [NSMutableArray array];
  for (int i = 0; i < 30; i++) {
    [FBSDKTypeUtility array:denseDataArray addObject:[NSNumber numberWithFloat:denseData[i]]];
  }
  return [denseDataArray componentsJoinedByString:@","];
}

+ (NSString *)getTextFromContentView:(UIView *)contentView
{
  NSMutableArray<NSString *> *textArray = [NSMutableArray array];
  for (UIView *subView in [contentView subviews]) {
    NSString *label = [FBSDKViewHierarchy getText:subView];
    if (label.length > 0) {
      [FBSDKTypeUtility array:textArray addObject:label];
    }
  }
  return [textArray componentsJoinedByString:@" "];
}

+ (void)logSuggestedEvent:(NSString *)event withText:(NSString *)text withDenseFeature:(NSString *)denseFeature
{
  NSString *metadata = [FBSDKBasicUtility JSONStringForObject:@{@"button_text" : text,
                                                                @"dense" : denseFeature, }
                                                        error:nil
                                         invalidObjectHandler:nil];
  if (!metadata) {
    return;
  }

  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                                initWithGraphPath:[NSString stringWithFormat:@"%@/suggested_events", [FBSDKSettings appID]]
                                parameters:@{
                                  @"event_name" : event,
                                  @"metadata" : metadata,
                                }
                                HTTPMethod:FBSDKHTTPMethodPOST];
  [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {}];
  return;
}

@end

#endif

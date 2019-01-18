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

#import "FBSDKEventBindingManager.h"

#import <objc/runtime.h>

#import <UIKit/UIKit.h>

#import "FBSDKCodelessMacros.h"
#import "FBSDKCodelessPathComponent.h"
#import "FBSDKEventBinding.h"
#import "FBSDKSwizzler.h"
#import "FBSDKTypeUtility.h"
#import "FBSDKViewHierarchy.h"

#define ReactNativeTargetKey          @"target"
#define ReactNativeTouchEndEventName  @"touchEnd"

#define ReactNativeClassRCTTextView   "RCTTextView"
#define ReactNativeClassRCTImageView  "RCTImageVIew"
#define ReactNativeClassRCTTouchEvent "RCTTouchEvent"
#define ReactNativeClassRCTTouchHandler "RCTTouchHandler"

static void fb_dispatch_on_main_thread(dispatch_block_t block) {
  dispatch_async(dispatch_get_main_queue(), block);
}

static void fb_dispatch_on_default_thread(dispatch_block_t block) {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), block);
}

@interface FBSDKEventBindingManager ()
{
  BOOL isStarted;
  NSMutableDictionary *reactBindings;
  NSSet *validClasses;
  BOOL hasReactNative;
  NSArray *eventBindings;
}
@end

@implementation FBSDKEventBindingManager

- (id)init {
  self = [super init];
  if (self) {
    isStarted = NO;
    hasReactNative = NO;
    reactBindings = [NSMutableDictionary dictionary];

    NSMutableSet *classes = [NSMutableSet set];
    [classes addObject:[UIControl class]];
    [classes addObject:[UITableView class]];
    [classes addObject:[UICollectionView class]];
    // ReactNative
    Class classRCTRootView = objc_lookUpClass(ReactNativeClassRCTRootView);
    if (classRCTRootView != nil) {
      hasReactNative = YES;
      Class classRCTView = objc_lookUpClass(ReactNativeClassRCTView);
      Class classRCTTextView = objc_lookUpClass(ReactNativeClassRCTTextView);
      Class classRCTImageView = objc_lookUpClass(ReactNativeClassRCTImageView);
      if (classRCTView) {
        [classes addObject:classRCTView];
      }
      if (classRCTTextView) {
        [classes addObject:classRCTTextView];
      }
      if (classRCTImageView) {
        [classes addObject:classRCTImageView];
      }
    }
    validClasses = [NSSet setWithSet:classes];
  }
  return self;
}

+ (NSArray *)parseArray:(NSArray *)array {
  NSMutableArray *result = [NSMutableArray array];

  for (NSDictionary *json in array) {
    FBSDKEventBinding *binding = [[FBSDKEventBinding alloc] initWithJSON:json];
    [result addObject:binding];
  }

  return [result copy];
}

- (FBSDKEventBindingManager*)initWithJSON:(NSDictionary*)dict
{
  if ((self = [super init])) {
    NSArray *eventBindingsDict = [FBSDKTypeUtility arrayValue:dict[@"event_bindings"]];
    NSMutableArray *bindings = [NSMutableArray array];
    for (NSDictionary *d in eventBindingsDict) {
      FBSDKEventBinding *e = [[FBSDKEventBinding alloc] initWithJSON:d];
      [bindings addObject:e];
    }
    eventBindings = [bindings copy];
  }
  return self;
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
- (void)start
{
  if (isStarted) {
    return;
  }
  isStarted = YES;

  void (^blockToSuperview)(id view) = ^(id view) {
    [self matchView:view delegate:nil];
  };

  void (^blockToWindow)(id view) = ^(id view) {
    [self matchView:view delegate:nil];
  };

  [FBSDKSwizzler swizzleSelector:@selector(didMoveToSuperview)
                         onClass:[UIControl class]
                       withBlock:blockToSuperview named:@"map_control"];
  [FBSDKSwizzler swizzleSelector:@selector(didMoveToWindow)
                         onClass:[UIControl class]
                       withBlock:blockToWindow named:@"map_control"];

  // ReactNative
  if (hasReactNative) { // If app is built via ReactNative
    Class classRCTView = objc_lookUpClass(ReactNativeClassRCTView);
    Class classRCTTextView = objc_lookUpClass(ReactNativeClassRCTTextView);
    Class classRCTImageView = objc_lookUpClass(ReactNativeClassRCTImageView);
    Class classRCTTouchHandler = objc_lookUpClass(ReactNativeClassRCTTouchHandler);

    //  All react-native views would be added tp RCTRootView, so no need to check didMoveToWindow
    [FBSDKSwizzler swizzleSelector:@selector(didMoveToSuperview)
                           onClass:classRCTView
                         withBlock:blockToSuperview
                             named:@"match_react_native"];
    [FBSDKSwizzler swizzleSelector:@selector(didMoveToSuperview)
                           onClass:classRCTTextView
                         withBlock:blockToSuperview
                             named:@"match_react_native"];
    [FBSDKSwizzler swizzleSelector:@selector(didMoveToSuperview)
                           onClass:classRCTImageView
                         withBlock:blockToSuperview
                             named:@"match_react_native"];

    // RCTTouchHandler handles with touch events, like touchEnd and uses RCTEventDispather to dispatch events, so we can check _updateAndDispatchTouches to fire events
    [FBSDKSwizzler swizzleSelector:@selector(_updateAndDispatchTouches:eventName:) onClass:classRCTTouchHandler withBlock:^(id touchHandler, SEL command, id touches, id eventName){
      if ([touches isKindOfClass:[NSSet class]] && [eventName isKindOfClass:[NSString class]]) {
        @try {
          NSString *reactEventName = (NSString *)eventName;
          NSSet<UITouch *> *reactTouches = (NSSet<UITouch *> *)touches;
          if ([reactEventName isEqualToString:ReactNativeTouchEndEventName]) {
            for (UITouch *touch in reactTouches) {
              UIView *targetView = ((UITouch *)touch).view.superview;
              NSNumber *reactTag = nil;
              // Find the closest React-managed touchable view like RCTTouchHandler
              while(targetView) {
                reactTag = [FBSDKViewHierarchy getViewReactTag:targetView];
                if (reactTag != nil && targetView.userInteractionEnabled) {
                  break;
                }
                targetView = targetView.superview;
              }
              FBSDKEventBinding *eventBinding = self->reactBindings[reactTag];
              if (reactTag != nil && eventBinding != nil) {
                [eventBinding trackEvent:nil];
              }
            }
          }
        }
        @catch(NSException *exception) {
          //  Catch exception here to prevent LytroKit from crashing app
        }
      }
    } named:@"dispatch_rn_event"];
  }

  //  UITableView
  void (^tableViewBlock)(UITableView *tableView,
                         SEL cmd,
                         id<UITableViewDelegate> delegate) =
  ^(UITableView *tableView, SEL cmd, id<UITableViewDelegate> delegate) {
    if (!delegate) {
      return;
    }

    [self matchView:tableView delegate:delegate];
  };
  [FBSDKSwizzler swizzleSelector:@selector(setDelegate:)
                         onClass:[UITableView class]
                       withBlock:tableViewBlock
                           named:@"match_table_view"];
  //  UICollectionView
  void (^collectionViewBlock)(UICollectionView *collectionView,
                              SEL cmd,
                              id<UICollectionViewDelegate> delegate) =
  ^(UICollectionView *collectionView, SEL cmd, id<UICollectionViewDelegate> delegate) {
    if (nil == delegate) {
      return;
    }

    [self matchView:collectionView delegate:delegate];
  };
  [FBSDKSwizzler swizzleSelector:@selector(setDelegate:)
                         onClass:[UICollectionView class]
                       withBlock:collectionViewBlock
                           named:@"handle_collection_view"];
}

- (void)rematchBindings {
  if (0 == eventBindings.count) {
    return;
  }

  NSArray *windows = [UIApplication sharedApplication].windows;
  for (UIWindow *window in windows) {
    [self matchSubviewsIn:window];
  }
}

- (void)matchSubviewsIn:(UIView *)view {
  if (!view) {
    return;
  }

  for (UIView *subview in view.subviews) {
    BOOL isValidClass = NO;
    for (Class cls in validClasses) {
      if ([subview isKindOfClass:cls]) {
        isValidClass = YES;
        break;
      }
    }

    if (isValidClass) {
      if ([subview isKindOfClass:[UITableView class]]) {
        UITableView *tableView = (UITableView *)subview;
        if (tableView.delegate) {
          [self matchView:subview delegate:tableView.delegate];
        }
      } else if ([subview isKindOfClass:[UICollectionView class]]) {
        UICollectionView *collectionView = (UICollectionView *)subview;
        if (collectionView.delegate) {
          [self matchView:subview delegate:collectionView.delegate];
        }
      } else {
        [self matchView:subview delegate:nil];
      }
    }

    if (![subview isKindOfClass:[UIControl class]]) {
      [self matchSubviewsIn:subview];
    }
  }
}

// check if the view is matched to any event
- (void)matchView:(UIView *)view delegate:(id)delegate {
  if (0 == eventBindings.count) {
    return;
  }

  fb_dispatch_on_main_thread(^{
    NSArray *path = [FBSDKViewHierarchy getPath:view];

    fb_dispatch_on_default_thread(^{
      if ([view isKindOfClass:[UIControl class]]) {
        UIControl *control = (UIControl *)view;
        for (FBSDKEventBinding *binding in self->eventBindings) {
          if ([FBSDKEventBinding isPath:binding.path matchViewPath:path]) {
            fb_dispatch_on_main_thread(^{
              [control addTarget:binding
                          action:@selector(trackEvent:)
                forControlEvents:UIControlEventTouchUpInside];
            });
            break;
          }
        }
      } else if (self->hasReactNative
                 && [view respondsToSelector:@selector(reactTag)]) {
        for (FBSDKEventBinding *binding in self->eventBindings) {
          if ([FBSDKEventBinding isPath:binding.path matchViewPath:path]) {
            fb_dispatch_on_main_thread(^{
              if (view) {
                NSNumber *reactTag = [FBSDKViewHierarchy getViewReactTag:view];
                if (reactTag != nil) {
                  self->reactBindings[reactTag] = binding;
                }
              }
            });
            break;
          }
        }
      } else if ([view isKindOfClass:[UITableView class]]
                 && [delegate conformsToProtocol:@protocol(UITableViewDelegate)]) {
        fb_dispatch_on_default_thread(^{
          NSMutableSet *matchedBindings = [NSMutableSet set];
          for (FBSDKEventBinding *binding in self->eventBindings) {
            if (binding.path.count > 1) {
              NSArray *shortPath = [binding.path
                                    subarrayWithRange:NSMakeRange(0, binding.path.count - 1)];
              if ([FBSDKEventBinding isPath:shortPath matchViewPath:path]) {
                [matchedBindings addObject:binding];
              }
            }
          }

          if (matchedBindings.count > 0) {
            NSArray *bindings = matchedBindings.allObjects;
            void (^block)(id, SEL, id, id) = ^(id target, SEL command, UITableView *tableView, NSIndexPath *indexPath) {
              fb_dispatch_on_main_thread(^{
                for (FBSDKEventBinding *binding in bindings) {
                  FBSDKCodelessPathComponent *component = binding.path.lastObject;
                  if ((component.section == -1 || component.section == indexPath.section)
                      && (component.row == -1 || component.row == indexPath.row)) {
                    UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
                    [binding trackEvent:cell];
                  }
                }
              });
            };
            [FBSDKSwizzler swizzleSelector:@selector(tableView:didSelectRowAtIndexPath:)
                                   onClass:[delegate class]
                                 withBlock:block
                                     named:@"handle_table_view"];
          }
        });
      } else if ([view isKindOfClass:[UICollectionView class]]
                 && [delegate conformsToProtocol:@protocol(UICollectionViewDelegate)]) {
        fb_dispatch_on_default_thread(^{
          NSMutableSet *matchedBindings = [NSMutableSet set];
          for (FBSDKEventBinding *binding in self->eventBindings) {
            if (binding.path.count > 1) {
              NSArray *shortPath = [binding.path
                                    subarrayWithRange:NSMakeRange(0, binding.path.count - 1)];
              if ([FBSDKEventBinding isPath:shortPath matchViewPath:path]) {
                [matchedBindings addObject:binding];
              }
            }
          }

          if (matchedBindings.count > 0) {
            NSArray *bindings = matchedBindings.allObjects;
            void (^block)(id, SEL, id, id) = ^(id target, SEL command, UICollectionView *collectionView, NSIndexPath *indexPath) {
              fb_dispatch_on_main_thread(^{
                for (FBSDKEventBinding *binding in bindings) {
                  FBSDKCodelessPathComponent *component = binding.path.lastObject;
                  if ((component.section == -1 || component.section == indexPath.section)
                      && (component.row ==  -1 || component.row == indexPath.row)) {
                    UICollectionViewCell *cell = [collectionView cellForItemAtIndexPath:indexPath];
                    [binding trackEvent:cell];
                  }
                }
              });
            };
            [FBSDKSwizzler swizzleSelector:@selector(collectionView:didSelectItemAtIndexPath:)
                                   onClass:[delegate class]
                                 withBlock:block
                                     named:@"handle_collection_view"];
          }
        });
      }
    });
  });
}

#pragma clang diagnostic pop
- (void)updateBindings:(NSArray *)bindings {
  eventBindings = bindings;
  [reactBindings removeAllObjects];
  fb_dispatch_on_main_thread(^{
    [self rematchBindings];
  });
}

@end

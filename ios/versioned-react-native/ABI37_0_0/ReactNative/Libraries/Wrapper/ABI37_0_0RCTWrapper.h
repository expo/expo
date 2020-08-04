// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <UIKit/UIKit.h>

#import <ABI37_0_0RCTWrapper/ABI37_0_0RCTWrapperView.h>
#import <ABI37_0_0RCTWrapper/ABI37_0_0RCTWrapperViewControllerHostingView.h>
#import <ABI37_0_0RCTWrapper/ABI37_0_0RCTWrapperViewManager.h>

// Umbrella header with macros

// ABI37_0_0RCT_WRAPPER_FOR_VIEW
#define ABI37_0_0RCT_WRAPPER_FOR_VIEW(ClassName)                                        \
                                                                               \
NS_ASSUME_NONNULL_BEGIN                                                        \
                                                                               \
@interface ClassName##Manager : ABI37_0_0RCTWrapperViewManager                          \
                                                                               \
@end                                                                           \
                                                                               \
NS_ASSUME_NONNULL_END                                                          \
                                                                               \
@implementation ClassName##Manager                                             \
                                                                               \
ABI37_0_0RCT_EXPORT_MODULE()                                                            \
                                                                               \
- (UIView *)view                                                               \
{                                                                              \
  ABI37_0_0RCTWrapperView *wrapperView = [super view];                                  \
  wrapperView.contentView = [ClassName new];                                   \
  return wrapperView;                                                          \
}                                                                              \
                                                                               \
@end

// ABI37_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER
#define ABI37_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ClassName)                             \
                                                                               \
NS_ASSUME_NONNULL_BEGIN                                                        \
                                                                               \
@interface ClassName##Manager : ABI37_0_0RCTWrapperViewManager                          \
                                                                               \
@end                                                                           \
                                                                               \
NS_ASSUME_NONNULL_END                                                          \
                                                                               \
@implementation ClassName##Manager                                             \
                                                                               \
ABI37_0_0RCT_EXPORT_MODULE()                                                            \
                                                                               \
- (UIView *)view                                                               \
{                                                                              \
  ABI37_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =      \
    [ABI37_0_0RCTWrapperViewControllerHostingView new];                                 \
  contentViewControllerHostingView.contentViewController =                     \
    [[ClassName alloc] initWithNibName:nil bundle:nil];                        \
  ABI37_0_0RCTWrapperView *wrapperView = [super view];                                  \
  wrapperView.contentView = contentViewControllerHostingView;                  \
  return wrapperView;                                                          \
}                                                                              \
                                                                               \
@end

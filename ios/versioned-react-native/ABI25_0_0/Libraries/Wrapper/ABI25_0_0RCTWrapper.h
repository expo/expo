// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import <ABI25_0_0RCTWrapper/ABI25_0_0RCTWrapperView.h>
#import <ABI25_0_0RCTWrapper/ABI25_0_0RCTWrapperViewControllerHostingView.h>
#import <ABI25_0_0RCTWrapper/ABI25_0_0RCTWrapperViewManager.h>

// Umbrella header with macros

// ABI25_0_0RCT_WRAPPER_FOR_VIEW
#define ABI25_0_0RCT_WRAPPER_FOR_VIEW(ClassName)                                        \
                                                                               \
NS_ASSUME_NONNULL_BEGIN                                                        \
                                                                               \
@interface ClassName##Manager : ABI25_0_0RCTWrapperViewManager                          \
                                                                               \
@end                                                                           \
                                                                               \
NS_ASSUME_NONNULL_END                                                          \
                                                                               \
@implementation ClassName##Manager                                             \
                                                                               \
ABI25_0_0RCT_EXPORT_MODULE()                                                            \
                                                                               \
- (UIView *)view                                                               \
{                                                                              \
  ABI25_0_0RCTWrapperView *wrapperView = [super view];                                  \
  wrapperView.contentView = [ClassName new];                                   \
  return wrapperView;                                                          \
}                                                                              \
                                                                               \
@end

// ABI25_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER
#define ABI25_0_0RCT_WRAPPER_FOR_VIEW_CONTROLLER(ClassName)                             \
                                                                               \
NS_ASSUME_NONNULL_BEGIN                                                        \
                                                                               \
@interface ClassName##Manager : ABI25_0_0RCTWrapperViewManager                          \
                                                                               \
@end                                                                           \
                                                                               \
NS_ASSUME_NONNULL_END                                                          \
                                                                               \
@implementation ClassName##Manager                                             \
                                                                               \
ABI25_0_0RCT_EXPORT_MODULE()                                                            \
                                                                               \
- (UIView *)view                                                               \
{                                                                              \
  ABI25_0_0RCTWrapperViewControllerHostingView *contentViewControllerHostingView =      \
    [ABI25_0_0RCTWrapperViewControllerHostingView new];                                 \
  contentViewControllerHostingView.contentViewController =                     \
    [[ClassName alloc] initWithNibName:nil bundle:nil];                        \
  ABI25_0_0RCTWrapperView *wrapperView = [super view];                                  \
  wrapperView.contentView = contentViewControllerHostingView;                  \
  return wrapperView;                                                          \
}                                                                              \
                                                                               \
@end

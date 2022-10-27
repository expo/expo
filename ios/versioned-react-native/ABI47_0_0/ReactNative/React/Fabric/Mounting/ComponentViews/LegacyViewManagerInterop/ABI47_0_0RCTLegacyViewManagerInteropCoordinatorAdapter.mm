/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTLegacyViewManagerInteropCoordinatorAdapter.h"
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>

@implementation ABI47_0_0RCTLegacyViewManagerInteropCoordinatorAdapter {
  ABI47_0_0RCTLegacyViewManagerInteropCoordinator *_coordinator;
  NSInteger _tag;
}

- (instancetype)initWithCoordinator:(ABI47_0_0RCTLegacyViewManagerInteropCoordinator *)coordinator ABI47_0_0ReactTag:(NSInteger)tag
{
  if (self = [super init]) {
    _coordinator = coordinator;
    _tag = tag;
  }
  return self;
}

- (void)dealloc
{
  [_paperView removeFromSuperview];
  [_coordinator removeObserveForTag:_tag];
}

- (UIView *)paperView
{
  if (!_paperView) {
    _paperView = [_coordinator createPaperViewWithTag:_tag];
    __weak __typeof(self) weakSelf = self;
    [_coordinator addObserveForTag:_tag
                        usingBlock:^(std::string eventName, folly::dynamic event) {
                          if (weakSelf.eventInterceptor) {
                            weakSelf.eventInterceptor(eventName, event);
                          }
                        }];
  }
  return _paperView;
}

- (void)setProps:(const folly::dynamic &)props
{
  [_coordinator setProps:props forView:self.paperView];
}

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args
{
  [_coordinator handleCommand:commandName args:args ABI47_0_0ReactTag:_tag];
}

@end

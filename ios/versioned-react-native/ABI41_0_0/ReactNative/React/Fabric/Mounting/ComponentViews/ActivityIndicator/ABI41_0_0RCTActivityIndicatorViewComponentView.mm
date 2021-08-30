/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTActivityIndicatorViewComponentView.h"

#import <ABI41_0_0React/components/rncore/ComponentDescriptors.h>
#import <ABI41_0_0React/components/rncore/EventEmitters.h>
#import <ABI41_0_0React/components/rncore/Props.h>

#import "ABI41_0_0FBABI41_0_0RCTFabricComponentsPlugins.h"

using namespace ABI41_0_0facebook::ABI41_0_0React;

static UIActivityIndicatorViewStyle convertActivityIndicatorViewStyle(const ActivityIndicatorViewSize &size)
{
  switch (size) {
    case ActivityIndicatorViewSize::Small:
      return UIActivityIndicatorViewStyleWhite;
    case ActivityIndicatorViewSize::Large:
      return UIActivityIndicatorViewStyleWhiteLarge;
  }
}

@implementation ABI41_0_0RCTActivityIndicatorViewComponentView {
  UIActivityIndicatorView *_activityIndicatorView;
}

#pragma mark - ABI41_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ActivityIndicatorViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ActivityIndicatorViewProps>();
    _props = defaultProps;

    _activityIndicatorView = [[UIActivityIndicatorView alloc] initWithFrame:self.bounds];
    _activityIndicatorView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    if (defaultProps->animating) {
      [_activityIndicatorView startAnimating];
    } else {
      [_activityIndicatorView stopAnimating];
    }
    _activityIndicatorView.color = [UIColor colorWithCGColor:defaultProps->color.get()];
    _activityIndicatorView.hidesWhenStopped = defaultProps->hidesWhenStopped;
    _activityIndicatorView.activityIndicatorViewStyle = convertActivityIndicatorViewStyle(defaultProps->size);

    [self addSubview:_activityIndicatorView];
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<const ActivityIndicatorViewProps>(_props);
  const auto &newViewProps = *std::static_pointer_cast<const ActivityIndicatorViewProps>(props);

  if (oldViewProps.animating != newViewProps.animating) {
    if (newViewProps.animating) {
      [_activityIndicatorView startAnimating];
    } else {
      [_activityIndicatorView stopAnimating];
    }
  }

  if (oldViewProps.color.get() != newViewProps.color.get()) {
    _activityIndicatorView.color = [UIColor colorWithCGColor:newViewProps.color.get()];
  }

  // TODO: This prop should be deprecated.
  if (oldViewProps.hidesWhenStopped != newViewProps.hidesWhenStopped) {
    _activityIndicatorView.hidesWhenStopped = newViewProps.hidesWhenStopped;
  }

  if (oldViewProps.size != newViewProps.size) {
    _activityIndicatorView.activityIndicatorViewStyle = convertActivityIndicatorViewStyle(newViewProps.size);
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<ABI41_0_0RCTComponentViewProtocol> ABI41_0_0RCTActivityIndicatorViewCls(void)
{
  return ABI41_0_0RCTActivityIndicatorViewComponentView.class;
}

//
//  PeekAndPop.mm
//  RouterE2E
//
//  Created by Jakub Tkacz on 26/05/2025.
//

#import "PeekAndPop.h"

#import <react/renderer/components/AppSpec/ComponentDescriptors.h>
#import <react/renderer/components/AppSpec/EventEmitters.h>
#import <react/renderer/components/AppSpec/Props.h>
#import <react/renderer/components/AppSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@implementation PeekAndPop {
  UIButton *_linkButton;
}

- (instancetype)init
{
  if (self = [super init]) {
    [self setupLinkButton];
  }
  return self;
}

- (void)setupLinkButton
{
  _linkButton = [UIButton buttonWithType:UIButtonTypeSystem];
  [_linkButton setTitle:@"Link" forState:UIControlStateNormal];
  [_linkButton addTarget:self action:@selector(linkButtonTapped) forControlEvents:UIControlEventTouchUpInside];
  
  [self addSubview:_linkButton];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  // Layout the button, for example at the bottom center
  CGFloat buttonWidth = 100;
  CGFloat buttonHeight = 44;
  CGFloat x = (self.bounds.size.width - buttonWidth) / 2;
  CGFloat y = self.bounds.size.height - buttonHeight - 10;
  _linkButton.frame = CGRectMake(x, y, buttonWidth, buttonHeight);
}

- (void)linkButtonTapped
{
  NSLog(@"Link button tapped");
  // You can add delegate/event bridge to JS here if needed
}


- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<PeekAndPopProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<PeekAndPopProps const>(props);

  [super updateProps:props oldProps:oldProps];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<PeekAndPopComponentDescriptor>();
}

@end

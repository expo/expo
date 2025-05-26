//
//  PeekAndPop.mm
//  RouterE2E
//
//  Created by Jakub Tkacz on 26/05/2025.
//

#import "PeekAndPop.h"

#import <UIKit/UIKit.h>
#import <react/renderer/components/AppSpec/ComponentDescriptors.h>
#import <react/renderer/components/AppSpec/EventEmitters.h>
#import <react/renderer/components/AppSpec/Props.h>
#import <react/renderer/components/AppSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface PeekAndPop () <RCTPeekAndPopViewProtocol,
                          UIContextMenuInteractionDelegate>
@end

@implementation PeekAndPop {
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    UIButton *button = [UIButton buttonWithType:UIButtonTypeSystem];
    [button setTitle:@"Click Me" forState:UIControlStateNormal];
    [button setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    [button setBackgroundColor:[UIColor systemBlueColor]];
    button.frame = CGRectMake(0, 0, 100, 40);
    button.layer.cornerRadius = 8;
    [button addTarget:self
                  action:@selector(linkButtonTapped)
        forControlEvents:UIControlEventTouchUpInside];

    UIContextMenuInteraction *interaction =
        [[UIContextMenuInteraction alloc] initWithDelegate:self];
    [button addInteraction:interaction];

    [self addSubview:button];
  }
  return self;
}

- (void)linkButtonTapped {
  NSLog(@"Link button tapped");
  // Optional: trigger an event to JS
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &oldViewProps =
      *std::static_pointer_cast<PeekAndPopProps const>(_props);
  const auto &newViewProps =
      *std::static_pointer_cast<PeekAndPopProps const>(props);

  [super updateProps:props oldProps:oldProps];
}

#pragma mark - UIContextMenuInteractionDelegate

- (UIContextMenuConfiguration *)contextMenuInteraction:
                                    (UIContextMenuInteraction *)interaction
                        configurationForMenuAtLocation:(CGPoint)location {
  return [UIContextMenuConfiguration configurationWithIdentifier:nil
      previewProvider:^UIViewController *_Nullable {
        return [self createPreviewViewController];
      }
      actionProvider:^UIMenu *_Nullable(
          NSArray<UIMenuElement *> *_Nonnull suggestedActions) {
        return [self createContextMenu];
      }];
}

- (void) contextMenuInteraction:(UIContextMenuInteraction *) interaction
willPerformPreviewActionForMenuWithConfiguration:(UIContextMenuConfiguration *) configuration
                       animator:(id<UIContextMenuInteractionCommitAnimating>) animator {
  NSLog(@"Preview tapped!");
  
  // 👉 Handle your custom logic here
  // You can send an event to JS or trigger any native behavior
}

#pragma mark - Context Menu Helpers

- (UIViewController *)createPreviewViewController {
  UIViewController *previewVC = [UIViewController new];
  previewVC.view = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 200, 100)];
  previewVC.view.backgroundColor = [UIColor systemGreenColor];

  UILabel *label = [[UILabel alloc] initWithFrame:previewVC.view.bounds];
  label.text = @"Preview Content";
  label.textAlignment = NSTextAlignmentCenter;
  label.textColor = [UIColor whiteColor];
  label.autoresizingMask =
      UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

  [previewVC.view addSubview:label];
  return previewVC;
}

- (UIMenu *)createContextMenu {
  UIAction *action1 =
      [UIAction actionWithTitle:@"Action 1"
                          image:nil
                     identifier:nil
                        handler:^(__kindof UIAction *_Nonnull action) {
                          NSLog(@"Action 1 selected");
                        }];

  return [UIMenu menuWithTitle:@"" children:@[ action1 ]];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider {
  return concreteComponentDescriptorProvider<PeekAndPopComponentDescriptor>();
}

@end

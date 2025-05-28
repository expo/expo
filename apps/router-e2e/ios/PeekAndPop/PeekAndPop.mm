//
//  PeekAndPop.mm
//  RouterE2E
//
//  Created by Jakub Tkacz on 26/05/2025.
//

#import "PeekAndPop.h"

#import <RNScreens/RNSScreen.h>
#import <RNScreens/RNSScreenStack.h>
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
  NSMutableArray<UIView *> *children;
}

- (void)mountChildComponentView:
            (UIView<RCTComponentViewProtocol> *)childComponentView
                          index:(NSInteger)index {
  [children insertObject:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:
            (UIView<RCTComponentViewProtocol> *)childComponentView
                            index:(NSInteger)index {
  [children removeObjectAtIndex:index];
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
    children = [NSMutableArray array];
  }
  return self;
}

- (void)linkButtonTapped {
  NSLog(@"Link button tapped");
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

- (void)contextMenuInteraction:(UIContextMenuInteraction *)interaction
    willPerformPreviewActionForMenuWithConfiguration:
        (UIContextMenuConfiguration *)configuration
                                            animator:
                                                (id<UIContextMenuInteractionCommitAnimating>)
                                                    animator {
  NSLog(@"Preview tapped!");
  [self pushPreloadedView];
  [animator addCompletion:^(void) {
      // This block will be executed when the animation finishes
      // or is stopped.
      // You can leave it empty if you don't need to do anything.
  }];
}

#pragma mark - Context Menu Helpers

- (UIViewController *)createPreviewViewController {
  UIViewController *previewVC = [UIViewController new];

  for (UIView *child in children) {
    [previewVC.view addSubview:child];
  }
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

- (RNSScreenStackView *)findScreenStackViewInResponderChain {
  UIResponder *responder = self;
  while (responder) {
    responder = [responder nextResponder];
    if ([responder isKindOfClass:[RNSScreenStackView class]]) {
      return (RNSScreenStackView *)responder;
    }
  }
  return nil; // No RNSScreenStackView found in the responder chain.
}

// Helper function to extract RNSScreenView objects from a list of subviews.
- (NSArray<RNSScreenView *> *)extractScreenViewsFromSubviews:
    (NSArray<UIView *> *)subviews {
      NSMutableArray<RNSScreenView *> *screenSubviews = [NSMutableArray array];
      for (UIView *subview in subviews) {
        if ([subview isKindOfClass:[RNSScreenView class]]) {
          [screenSubviews addObject:(RNSScreenView *)subview];
        }
      }
  return [screenSubviews copy]; // Return an immutable copy.
}

// Helper function to find the preloaded screen view (activityState == 0).
- (RNSScreenView *)findPreloadedScreenView:
    (NSArray<RNSScreenView *> *)screenViews {
  for (RNSScreenView *screenView in screenViews) {
        NSLog(@"ScreenView activityState: %ld", (long)screenView.activityState);
        if (screenView.activityState == 0) {
      return screenView;
    }
  }
  return nil; // No preloaded screen view found.
}

// The main function, now cleaner and orchestrating the helper functions.
- (void)pushPreloadedView {
  RNSScreenStackView *stack = [self findScreenStackViewInResponderChain];

  if (stack) {
    NSArray<UIView *> *subviews = stack.reactSubviews;
    NSLog(@"Number of subviews: %lu", (unsigned long)subviews.count);

    NSArray<RNSScreenView *> *screenSubviews =
        [self extractScreenViewsFromSubviews:subviews];

    RNSScreenView *preloadedScreenView =
        [self findPreloadedScreenView:screenSubviews];

    if (preloadedScreenView) {
      [preloadedScreenView setActivityState:2];
      [stack markChildUpdated];
    } else {
      NSLog(@"No preloaded screen view found with activityState == 0.");
    }
  } else {
    NSLog(@"RNSScreenStackView not found in the responder chain.");
  }
}

@end

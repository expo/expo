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
#import <react/renderer/components/MoviesPeekAndPop/ComponentDescriptors.h>
#import <react/renderer/components/MoviesPeekAndPop/EventEmitters.h>
#import <react/renderer/components/MoviesPeekAndPop/Props.h>
#import <react/renderer/components/MoviesPeekAndPop/RCTComponentViewHelpers.h>

using namespace facebook::react;

@interface PeekAndPop () <RCTPeekAndPopViewProtocol,
                          UIContextMenuInteractionDelegate>
@end

@implementation PeekAndPop {
  PeekAndPopTrigger *trigger;
  PeekAndPopPreview *preview;
  RNSScreenView *preloadedScreenView;
  UIContextMenuInteraction *interaction;
}

- (void)mountChildComponentView:
            (UIView<RCTComponentViewProtocol> *)childComponentView
                          index:(NSInteger)index {
  if ([childComponentView isKindOfClass:[PeekAndPopTrigger class]]) {
    [super mountChildComponentView:childComponentView index:index];
    trigger = (PeekAndPopTrigger *)childComponentView;
  } else if ([childComponentView isKindOfClass:[PeekAndPopPreview class]]) {
    preview = (PeekAndPopPreview *)childComponentView;
    [self addInteraction:interaction];
  } else {
    NSLog(@"Unknown child component view %@", childComponentView);
  }
}

- (void)unmountChildComponentView:
            (UIView<RCTComponentViewProtocol> *)childComponentView
                            index:(NSInteger)index {
  if ([childComponentView isKindOfClass:[PeekAndPopTrigger class]]) {
    [super unmountChildComponentView:childComponentView index:index];
    trigger = nil;
  } else if ([childComponentView isKindOfClass:[PeekAndPopPreview class]]) {
    preview = nil;
    [self removeInteraction:interaction];
  } else {
    NSLog(@"Unknown child component view");
  }
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    interaction =
        [[UIContextMenuInteraction alloc] initWithDelegate:self];
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props
           oldProps:(Props::Shared const &)oldProps {
  const auto &oldViewProps =
      *std::static_pointer_cast<PeekAndPopProps const>(_props);
  const auto &newViewProps =
      *std::static_pointer_cast<PeekAndPopProps const>(props);

  if (oldViewProps.nextScreenKey != newViewProps.nextScreenKey) {
    if (newViewProps.nextScreenKey) {
      preloadedScreenView = [self
          findPreloadedScreenViewWithScreenKey:newViewProps.nextScreenKey];
      if (preloadedScreenView != nil) {
        NSLog(@"Props: Preloaded screen view found");
      } else {
        NSLog(@"Props: Preloaded screen view not found");
      }
    }
  }

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
    willDisplayMenuForConfiguration:(UIContextMenuConfiguration *)configuration
                           animator:
                               (id<UIContextMenuInteractionAnimating>)animator {
  if (self.eventEmitter) {
    self.eventEmitter->onWillPreviewOpen(PeekAndPopEventEmitter::OnWillPreviewOpen{});
  }
  [animator addCompletion:^(void){
    if (self.eventEmitter) {
      self.eventEmitter->onDidPreviewOpen(PeekAndPopEventEmitter::OnDidPreviewOpen{});
    }
  }];
}

- (void)contextMenuInteraction:(UIContextMenuInteraction *)interaction
       willEndForConfiguration:(UIContextMenuConfiguration *)configuration
                      animator:(id<UIContextMenuInteractionAnimating>)animator {
  if (self.eventEmitter) {
    self.eventEmitter->onPreviewClose(PeekAndPopEventEmitter::OnPreviewClose{});
  }
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
    if (self.eventEmitter) {
      self.eventEmitter->onPreviewTapped(
                                         PeekAndPopEventEmitter::OnPreviewTapped{});
    }
  }];
}

#pragma mark - Events

- (const PeekAndPopEventEmitter*)eventEmitter {
  return dynamic_cast<const PeekAndPopEventEmitter*>(_eventEmitter.get());
}

#pragma mark - Context Menu Helpers

- (UIViewController *)createPreviewViewController {
  if (preview != nil) {
    UIViewController *previewVC =
        [[PreviewViewController alloc] initWithPeekAndPopPreview:preview];
    [previewVC.view addSubview:preview];
    return previewVC;
  }
  return [UIViewController new];
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

- (RNSScreenView *)findPreloadedScreenViewWithScreenKey:(int)screenKey {
  RNSScreenStackView *stack = [self findScreenStackViewInResponderChain];

  NSLog(@"Screen Key: %d", screenKey);
  if (stack) {
    NSArray<UIView *> *subviews = stack.reactSubviews;

    NSArray<RNSScreenView *> *screenSubviews =
        [self extractScreenViewsFromSubviews:subviews];
    for (RNSScreenView *screenView in screenSubviews) {
      if (screenView.activityState == 0 && screenView.tag == screenKey) {
        return screenView;
      }
    }
  }
  return nil; // No preloaded screen view found.
}

// The main function, now cleaner and orchestrating the helper functions.
- (void)pushPreloadedView {
  RNSScreenStackView *stack = [self findScreenStackViewInResponderChain];

  if (preloadedScreenView != nil && stack != nil) {
    [preloadedScreenView setActivityState:2];
    [stack markChildUpdated];
    NSLog(@"Preloaded screen view pushed.");
  } else {
    NSLog(@"No preloaded screen view found.");
  }
}

@end

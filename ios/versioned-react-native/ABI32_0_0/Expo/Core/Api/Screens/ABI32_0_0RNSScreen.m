#import "ABI32_0_0RNSScreen.h"
#import "ABI32_0_0RNSScreenContainer.h"

@interface ABI32_0_0RNSScreen : UIViewController

- (instancetype)initWithView:(UIView *)view;
- (void)notifyFinishTransitioning;

@end

@implementation ABI32_0_0RNSScreenView {
  ABI32_0_0RNSScreen *_controller;
}

@synthesize controller = _controller;

- (instancetype)init
{
  if (self = [super init]) {
    _controller = [[ABI32_0_0RNSScreen alloc] initWithView:self];
    _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
  }
  return self;
}

- (void)setActive:(BOOL)active
{
  if (active != _active) {
    _active = active;
    [_ReactABI32_0_0Superview markChildUpdated];
  }
}

- (void)setPointerEvents:(ABI32_0_0RCTPointerEvents)pointerEvents
{
  // pointer events settings are managed by the parent screen container, we ignore any attempt
  // of setting that via ReactABI32_0_0 props
}

- (UIView *)ReactABI32_0_0Superview
{
  return _ReactABI32_0_0Superview;
}

- (void)invalidate
{
  _controller.view = nil;
  _controller = nil;
}

- (void)notifyFinishTransitioning
{
  [_controller notifyFinishTransitioning];
}

@end

@implementation ABI32_0_0RNSScreen {
  __weak UIView *_view;
  __weak id _previousFirstResponder;
}

- (instancetype)initWithView:(UIView *)view
{
  if (self = [super init]) {
    _view = view;
  }
  return self;
}

- (id)findFirstResponder:(UIView*)parent
{
  if (parent.isFirstResponder) {
    return parent;
  }
  for (UIView *subView in parent.subviews) {
    id responder = [self findFirstResponder:subView];
    if (responder != nil) {
      return responder;
    }
  }
  return nil;
}

- (void)willMoveToParentViewController:(UIViewController *)parent
{
  if (parent == nil) {
    id responder = [self findFirstResponder:self.view];
    if (responder != nil) {
      _previousFirstResponder = responder;
    }
  }
}

- (void)notifyFinishTransitioning
{
  [_previousFirstResponder becomeFirstResponder];
  _previousFirstResponder = nil;
}

- (void)loadView
{
  self.view = _view;
  _view = nil;
}

@end

@implementation ABI32_0_0RNSScreenManager

ABI32_0_0RCT_EXPORT_MODULE()

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(active, BOOL)

- (UIView *)view
{
  return [[ABI32_0_0RNSScreenView alloc] init];
}

@end

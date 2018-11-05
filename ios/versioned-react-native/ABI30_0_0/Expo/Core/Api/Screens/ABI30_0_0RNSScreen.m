#import "ABI30_0_0RNSScreen.h"
#import "ABI30_0_0RNSScreenContainer.h"

@interface ABI30_0_0RNSScreen : UIViewController

- (instancetype)initWithView:(UIView *)view;

@end

@implementation ABI30_0_0RNSScreenView

- (instancetype)init
{
  if (self = [super init]) {
    _controller = [[ABI30_0_0RNSScreen alloc] initWithView:self];
    _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
  }
  return self;
}

- (void)setActive:(BOOL)active
{
  if (active != _active) {
    _active = active;
    [_ReactABI30_0_0Superview markChildUpdated];
  }
}

- (UIView *)ReactABI30_0_0Superview
{
  return _ReactABI30_0_0Superview;
}

- (void)invalidate
{
  _controller.view = nil;
  _controller = nil;
}

@end

@implementation ABI30_0_0RNSScreen {
  __weak UIView *_view;
}

- (instancetype)initWithView:(UIView *)view
{
  if (self = [super init]) {
    _view = view;
  }
  return self;
}

- (void)loadView
{
  self.view = _view;
  _view = nil;
}

@end

@implementation ABI30_0_0RNSScreenManager

ABI30_0_0RCT_EXPORT_MODULE()

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(active, BOOL)

- (UIView *)view
{
  return [[ABI30_0_0RNSScreenView alloc] init];
}

@end

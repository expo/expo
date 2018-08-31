#import "RNSScreen.h"
#import "RNSScreenContainer.h"

@interface RNSScreen : UIViewController

- (instancetype)initWithView:(UIView *)view;

@end

@implementation RNSScreenView

- (instancetype)init
{
  if (self = [super init]) {
    _controller = [[RNSScreen alloc] initWithView:self];
    _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
  }
  return self;
}

- (void)setActive:(BOOL)active
{
  if (active != _active) {
    _active = active;
    [_reactSuperview markChildUpdated];
  }
}

- (UIView *)reactSuperview
{
  return _reactSuperview;
}

- (void)invalidate
{
  _controller.view = nil;
  _controller = nil;
}

@end

@implementation RNSScreen {
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

@implementation RNSScreenManager

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(active, BOOL)

- (UIView *)view
{
  return [[RNSScreenView alloc] init];
}

@end

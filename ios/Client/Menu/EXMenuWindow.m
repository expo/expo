#import "EXMenuWindow.h"
#import "EXMenuViewController.h"


@implementation EXMenuWindow

- (instancetype)init
{
  if (self = [super init]) {
    self.windowLevel = UIWindowLevelNormal;
    self.backgroundColor = [UIColor clearColor];
  }
  return self;
}

- (void)becomeKeyWindow
{
  [[[[UIApplication sharedApplication] delegate] window] makeKeyWindow];
}

@end

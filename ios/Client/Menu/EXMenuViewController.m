
#import "EXMenuViewController.h"

@interface EXMenuViewController ()

@property (nonatomic, strong) UIButton *btnGoHome;
@property (nonatomic, strong) UIButton *btnRefresh;

@end

@implementation EXMenuViewController

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor whiteColor];

  _btnGoHome = [UIButton buttonWithType:UIButtonTypeRoundedRect];
  [_btnGoHome setTitle:@"Home" forState:UIControlStateNormal];
  [_btnGoHome addTarget:self action:@selector(_onPressGoHome) forControlEvents:UIControlEventTouchUpInside];
  [self.view addSubview:_btnGoHome];
  
  _btnRefresh = [UIButton buttonWithType:UIButtonTypeRoundedRect];
  [_btnRefresh setTitle:@"Refresh" forState:UIControlStateNormal];
  [_btnRefresh addTarget:self action:@selector(_onPressRefresh) forControlEvents:UIControlEventTouchUpInside];
  [self.view addSubview:_btnRefresh];
}

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];
  _btnRefresh.frame = CGRectMake(0, 0, self.view.bounds.size.width - 16.0f, 32.0f);
  _btnRefresh.center = CGPointMake(CGRectGetMidX(self.view.bounds), CGRectGetMidY(self.view.bounds) - 24.0f);
  _btnGoHome.frame = _btnRefresh.frame;
  _btnGoHome.center = CGPointMake(_btnRefresh.center.x, _btnRefresh.center.y + 48.0f);
}

#pragma mark - internal

- (void)_onPressGoHome
{
  if (_delegate) {
    [_delegate menuViewControllerDidSelectHome:self];
  }
}

- (void)_onPressRefresh
{
  if (_delegate) {
    [_delegate menuViewControllerDidSelectRefresh:self];
  }
}

@end

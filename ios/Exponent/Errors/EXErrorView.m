// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorView.h"
#import "EXShellManager.h"

@interface EXErrorView ()

@property (nonatomic, strong) UILabel *lblError;
@property (nonatomic, strong) UIButton *btnRetry;
@property (nonatomic, strong) UILabel *lblErrorDetail;
@property (nonatomic, strong) UIScrollView *vContainer;

- (void)_onTapRetry;

@end

@implementation EXErrorView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.backgroundColor = [UIColor whiteColor];
    
    self.vContainer = [[UIScrollView alloc] init];
    [self addSubview:_vContainer];

    // error description label
    self.lblError = [[UILabel alloc] init];
    _lblError.numberOfLines = 0;
    _lblError.textAlignment = NSTextAlignmentCenter;
    _lblError.font = [UIFont systemFontOfSize:14.0f];
    [_vContainer addSubview:_lblError];
    
    // retry button
    self.btnRetry = [UIButton buttonWithType:UIButtonTypeSystem];
    [_btnRetry setTitle:@"Refresh" forState:UIControlStateNormal];
    [_btnRetry addTarget:self action:@selector(_onTapRetry) forControlEvents:UIControlEventTouchUpInside];
    [_vContainer addSubview:_btnRetry];

    // error detail label
    self.lblErrorDetail = [[UILabel alloc] init];
    _lblErrorDetail.numberOfLines = 0;
    _lblErrorDetail.textAlignment = NSTextAlignmentLeft;
    _lblErrorDetail.font = [UIFont systemFontOfSize:14.0f];
    _lblErrorDetail.textColor = [UIColor lightGrayColor];
    [_vContainer addSubview:_lblErrorDetail];
  }
  return self;
}

- (void)setType:(EXFatalErrorType)type
{
  _type = type;
  NSString *appOwnerName;
  if ([EXShellManager sharedInstance].isShell) {
    // TODO: allow the developer to configure this somehow
    appOwnerName = @"the app";
  } else {
    appOwnerName = @"Expo";
  }
  switch (type) {
    case kEXFatalErrorTypeLoading: {
      _lblError.text = [NSString stringWithFormat:@"There was a problem loading %@. Make sure you're connected to the internet and retry.", appOwnerName];
      break;
    }
    case kEXFatalErrorTypeException: {
      _lblError.text = [NSString stringWithFormat:@"There was a problem running %@.", appOwnerName];
      break;
    }
  }
  [self _resetUIState];
}

- (void)setError:(NSError *)error
{
  _error = error;
  _lblErrorDetail.text = [error localizedDescription];
  [self _resetUIState];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  _vContainer.frame = self.bounds;
  CGFloat maxLabelWidth = self.bounds.size.width * 0.95f;

  _lblError.frame = CGRectMake(0, 0, maxLabelWidth, CGFLOAT_MAX);
  [_lblError sizeToFit];
  _lblError.center = CGPointMake(self.bounds.size.width * 0.5f, self.bounds.size.height * 0.3f);

  _btnRetry.frame = CGRectMake(0, 0, self.bounds.size.width, 24.0f);
  _btnRetry.center = CGPointMake(_lblError.center.x, CGRectGetMaxY(_lblError.frame) + 48);

  _lblErrorDetail.frame = CGRectMake(0, 0, maxLabelWidth, CGFLOAT_MAX);
  [_lblErrorDetail sizeToFit];

  CGFloat minErrorDetailY = CGRectGetMaxY(_btnRetry.frame) + 16;
  if (_lblErrorDetail.bounds.size.height > self.bounds.size.height - minErrorDetailY) {
    _lblErrorDetail.center = CGPointMake(_lblError.center.x, minErrorDetailY + CGRectGetMidY(_lblErrorDetail.bounds));
  } else {
    _lblErrorDetail.center = CGPointMake(_lblError.center.x, CGRectGetMaxY(self.bounds) - CGRectGetMidY(_lblErrorDetail.bounds) - 16.0f);
  }

  _vContainer.contentSize = CGSizeMake(_vContainer.bounds.size.width, CGRectGetMaxY(_lblErrorDetail.frame) + 12.0f);
}

#pragma mark - Internal

- (void)_resetUIState
{
  [self setNeedsLayout];
}

- (void)_onTapRetry
{
  if (_delegate) {
    [_delegate errorViewDidSelectRetry:self];
  }
}

@end

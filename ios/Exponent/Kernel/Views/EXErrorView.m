// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorView.h"
#import "EXKernel.h"
#import "EXAppLoader.h"
#import "EXKernelAppRecord.h"
#import "EXShellManager.h"
#import "EXUtil.h"

@interface EXErrorView ()

@property (nonatomic, strong) UILabel *lblError;
@property (nonatomic, strong) UIButton *btnRetry;
@property (nonatomic, strong) UIButton *btnBack;
@property (nonatomic, strong) UILabel *lblUrl;
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
    self.btnRetry = [UIButton buttonWithType:UIButtonTypeRoundedRect];
    [_btnRetry setTitle:@"Try again" forState:UIControlStateNormal];
    [_btnRetry addTarget:self action:@selector(_onTapRetry) forControlEvents:UIControlEventTouchUpInside];
    [_vContainer addSubview:_btnRetry];
    
    // back button
    self.btnBack = [UIButton buttonWithType:UIButtonTypeRoundedRect];
    [_btnBack setTitle:@"Go back to Expo Home" forState:UIControlStateNormal];
    [_btnBack addTarget:self action:@selector(_onTapBack) forControlEvents:UIControlEventTouchUpInside];
    [_vContainer addSubview:_btnBack];
    
    for (UIButton *btnToStyle in @[ _btnRetry, _btnBack ]) {
      [btnToStyle setTintColor:[EXUtil colorWithRGB:0x49a7e8]];
      [btnToStyle.titleLabel setFont:[UIFont boldSystemFontOfSize:14.0f]];
    }
    
    // url label
    self.lblUrl = [[UILabel alloc] init];
    _lblUrl.numberOfLines = 0;
    _lblUrl.textAlignment = NSTextAlignmentCenter;
    [_vContainer addSubview:_lblUrl];

    // error detail label
    self.lblErrorDetail = [[UILabel alloc] init];
    _lblErrorDetail.numberOfLines = 0;
    _lblErrorDetail.textAlignment = NSTextAlignmentLeft;
    [_vContainer addSubview:_lblErrorDetail];
    
    for (UILabel *lblToStyle in @[ _lblUrl, _lblErrorDetail ]) {
      lblToStyle.font = [UIFont systemFontOfSize:14.0f];
      lblToStyle.textColor = [UIColor lightGrayColor];
    }
  }
  return self;
}

- (void)setType:(EXFatalErrorType)type
{
  _type = type;
  NSString *appOwnerName = @"the requested app";
  if (_appRecord) {
    if (_appRecord == [EXKernel sharedInstance].appRegistry.homeAppRecord) {
      appOwnerName = @"Expo";
    } else if (_appRecord.appLoader.manifest && _appRecord.appLoader.manifest[@"name"]) {
      appOwnerName = [NSString stringWithFormat:@"\"%@\"", _appRecord.appLoader.manifest[@"name"]];
    }
  }

  switch (type) {
    case kEXFatalErrorTypeLoading: {
      _lblError.text = [NSString stringWithFormat:@"There was a problem loading %@.", appOwnerName];
      if (_error.code == kCFURLErrorNotConnectedToInternet) {
        _lblError.text = [NSString stringWithFormat:@"%@ Make sure you're connected to the internet.", _lblError.text];
      } else if (_error.code == kEXErrorCodeAppForbidden) {
        _lblError.text = [NSString stringWithFormat:@"Sorry, you are not allowed to load %@.", appOwnerName];
      } else if (_appRecord.appLoader.manifestUrl) {
        NSString *url = _appRecord.appLoader.manifestUrl.absoluteString;
        if ([self _urlLooksLikeLAN:url]) {
          _lblError.text = [NSString stringWithFormat:
                            @"%@ It looks like you may be using a LAN URL. "
                            "Make sure your device is on the same network as the server or try using a tunnel.", _lblError.text];
        }
      }
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

- (void)setAppRecord:(EXKernelAppRecord *)appRecord
{
  _appRecord = appRecord;
  [self _resetUIState];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  _vContainer.frame = self.bounds;
  CGFloat maxLabelWidth = self.bounds.size.width - 32.0f;

  _lblError.frame = CGRectMake(0, 0, maxLabelWidth, CGFLOAT_MAX);
  [_lblError sizeToFit];
  _lblError.center = CGPointMake(self.bounds.size.width * 0.5f, self.bounds.size.height * 0.25f);

  _btnRetry.frame = CGRectMake(0, 0, self.bounds.size.width, 24.0f);
  _btnRetry.center = CGPointMake(_lblError.center.x, CGRectGetMaxY(_lblError.frame) + 32.0f);
  
  _btnBack.frame = CGRectMake(0, 0, self.bounds.size.width, 24.0f);
  _btnBack.center = CGPointMake(_lblError.center.x, CGRectGetMaxY(_btnRetry.frame) + 24);
  
  _lblUrl.frame = CGRectMake(0, 0, self.bounds.size.width - 48.0f, CGFLOAT_MAX);
  [_lblUrl sizeToFit];
  _lblUrl.center = CGPointMake(_lblError.center.x, CGRectGetMaxY(_btnBack.frame) + 12.0f + CGRectGetMidY(_lblUrl.bounds));

  _lblErrorDetail.frame = CGRectMake(0, 0, maxLabelWidth, CGFLOAT_MAX);
  [_lblErrorDetail sizeToFit];

  _lblErrorDetail.center = CGPointMake(_lblError.center.x, CGRectGetMaxY(_lblUrl.frame) + 24.0f + CGRectGetMidY(_lblErrorDetail.bounds));

  _vContainer.contentSize = CGSizeMake(_vContainer.bounds.size.width, CGRectGetMaxY(_lblErrorDetail.frame) + 12.0f);
}

#pragma mark - Internal

- (void)_resetUIState
{
  EXKernelAppRecord *homeRecord = [EXKernel sharedInstance].appRegistry.homeAppRecord;
  _btnBack.hidden = (!homeRecord || _appRecord == homeRecord);
  _lblUrl.hidden = (!homeRecord && ![self _isDevDetached]);
  _lblUrl.text = _appRecord.appLoader.manifestUrl.absoluteString;
  // TODO: maybe hide retry (see BrowserErrorView)
  [self setNeedsLayout];
}

- (void)_onTapRetry
{
  if (_delegate) {
    [_delegate errorViewDidSelectRetry:self];
  }
}

- (void)_onTapBack
{
  if ([EXKernel sharedInstance].browserController) {
    [[EXKernel sharedInstance].browserController moveHomeToVisible];
  }
}

- (BOOL)_urlLooksLikeLAN:(NSString *)url
{
  return (
    url && (
      [url rangeOfString:@".local"].length > 0 ||
      [url rangeOfString:@"192."].length > 0 ||
      [url rangeOfString:@"10."].length > 0 ||
      [url rangeOfString:@"172."].length > 0
    )
  );
}

- (BOOL)_isDevDetached
{
  return [EXShellManager sharedInstance].isDetached && [EXShellManager sharedInstance].isDebugXCodeScheme;
}

@end

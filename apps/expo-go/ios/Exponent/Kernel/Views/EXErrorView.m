// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAbstractLoader.h"
#import "EXErrorView.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelAppRecord.h"
#import "EXManifestResource.h"
#import "EXUtil.h"

@import EXManifests;

@interface EXErrorView ()

@property (nonatomic, strong) IBOutlet UILabel *lblError;
@property (nonatomic, strong) IBOutlet UIButton *btnRetry;
@property (nonatomic, strong) IBOutlet UIButton *btnBack;
@property (nonatomic, strong) IBOutlet UIStackView *btnStack;
@property (nonatomic, strong) IBOutlet UIView *btnStackContainer;
@property (nonatomic, strong) IBOutlet UILabel *lblUrl;
@property (nonatomic, strong) IBOutlet UITextView *txtErrorDetail;
@property (nonatomic, strong) IBOutlet UIScrollView *vContainer;
@property (nonatomic, strong) IBOutlet UILabel *lblFixHeader;
@property (nonatomic, strong) IBOutlet UITextView *txtFixDetail;


- (void)_onTapRetry;

@end

@implementation EXErrorView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSBundle mainBundle] loadNibNamed:@"EXErrorView" owner:self options:nil];
    [self addSubview:_vContainer];
    
    [_btnRetry addTarget:self action:@selector(_onTapRetry) forControlEvents:UIControlEventTouchUpInside];
    [_btnBack addTarget:self action:@selector(_onTapBack) forControlEvents:UIControlEventTouchUpInside];

    [_txtErrorDetail setTextContainerInset:UIEdgeInsetsZero];
    _txtErrorDetail.textContainer.lineFragmentPadding = 0;

    [_txtFixDetail setTextContainerInset:UIEdgeInsetsZero];
    _txtFixDetail.textContainer.lineFragmentPadding = 0;

    for (UIButton *btnToStyle in @[ _btnRetry, _btnBack ]) {
      btnToStyle.layer.cornerRadius = 4.0;
      btnToStyle.layer.masksToBounds = YES;
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
    } else if (_appRecord.appLoader.manifest && _appRecord.appLoader.manifest.name) {
      appOwnerName = [NSString stringWithFormat:@"\"%@\"", _appRecord.appLoader.manifest.name];
    }
  }

  switch (type) {
    case kEXFatalErrorTypeLoading: {
      _lblError.text = [NSString stringWithFormat:@"There was a problem loading %@.", appOwnerName];
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
  NSString *errorHeader = [EXManifestResource formatHeader:error];
  NSString *errorDetail = [error localizedDescription];
  NSString *errorFixInstructions = [error userInfo][EXFixInstructionsKey];
  NSNumber *showTryAgainButtonNumber = [error userInfo][EXShowTryAgainButtonKey];
  Boolean showTryAgainButton = [showTryAgainButtonNumber boolValue];

  if (errorHeader != nil) {
    _lblError.text = errorHeader;
  }

  switch (_type) {
    case kEXFatalErrorTypeLoading: {
      if (_error.code == kCFURLErrorNotConnectedToInternet) {
        errorDetail = [NSString stringWithFormat:@"%@ Make sure you're connected to the internet.", errorDetail];
      } else if (_appRecord.appLoader.manifestUrl) {
        NSString *url = _appRecord.appLoader.manifestUrl.absoluteString;
        if ([self _urlLooksLikeLAN:url]) {
          NSString *extraLANPermissionText = @"";
          if (@available(iOS 14, *)) {
            extraLANPermissionText = @", and that you have granted Expo Go the Local Network permission in the Settings app,";
          }
          errorDetail = [NSString stringWithFormat:
                            @"%@\n\nIt looks like you may be using a LAN URL. "
                            "Make sure your device is on the same network as the server%@ or try using the tunnel connection type.", errorDetail, extraLANPermissionText];
        }
      }
      break;
    }
    case kEXFatalErrorTypeException: {
      break;
    }
  }

  UIFont *font = _txtErrorDetail.font;
  NSAttributedString *attributedErrorString =[[NSAttributedString alloc] initWithString:errorDetail];
  attributedErrorString = [EXManifestResource parseUrlsAndBoldInAttributedString:attributedErrorString withFont:font];

  _txtErrorDetail.attributedText = attributedErrorString;
  _txtErrorDetail.textColor = [UIColor colorNamed:@"textDefault"];

  if (errorFixInstructions != nil) {
    NSAttributedString *attributedFixInstructions = [[NSAttributedString alloc] initWithString:errorFixInstructions];
    attributedFixInstructions = [EXManifestResource parseUrlsAndBoldInAttributedString:attributedFixInstructions withFont:font];
    _txtFixDetail.attributedText = attributedFixInstructions;
    _txtFixDetail.textColor = [UIColor colorNamed:@"textDefault"];
  } else {
    [_lblFixHeader removeFromSuperview];
    [_txtFixDetail removeFromSuperview];
  }

  if (!showTryAgainButton) {
    [_btnRetry removeFromSuperview];
  }

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

  self.backgroundColor = [UIColor colorNamed:@"backgroundDefault"];

  _vContainer.translatesAutoresizingMaskIntoConstraints = NO;

  UILayoutGuide *guide = self.safeAreaLayoutGuide;
  [_vContainer.leadingAnchor constraintEqualToAnchor:guide.leadingAnchor].active = YES;
  [_vContainer.trailingAnchor constraintEqualToAnchor:guide.trailingAnchor].active = YES;
  [_vContainer.topAnchor constraintEqualToAnchor:guide.topAnchor].active = YES;
  [_vContainer.bottomAnchor constraintEqualToAnchor:guide.bottomAnchor].active = YES;
}

#pragma mark - Internal

- (void)_resetUIState
{
  EXKernelAppRecord *homeRecord = [EXKernel sharedInstance].appRegistry.homeAppRecord;
  _btnBack.hidden = (!homeRecord || _appRecord == homeRecord);
  _lblUrl.hidden = !homeRecord;
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

@end

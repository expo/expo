// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKAppLinkReturnToRefererView.h"

#import "FBSDKAppLink.h"
#import "FBSDKAppLinkTarget.h"

static const CGFloat FBSDKMarginX = 8.5f;
static const CGFloat FBSDKMarginY = 8.5f;

static NSString *const FBSDKRefererAppLink = @"referer_app_link";
static NSString *const FBSDKRefererAppName = @"app_name";
static NSString *const FBSDKRefererUrl = @"url";
static const CGFloat FBSDKCloseButtonWidth = 12.0;
static const CGFloat FBSDKCloseButtonHeight = 12.0;

@interface FBSDKAppLinkReturnToRefererView ()

@property (nonatomic, strong) UILabel *labelView;
@property (nonatomic, strong) UIButton *closeButton;
@property (nonatomic, strong) UITapGestureRecognizer *insideTapGestureRecognizer;

@end

@implementation FBSDKAppLinkReturnToRefererView {
    BOOL _explicitlyHidden;
}

#pragma mark - Initialization

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        [self commonInit];
        [self sizeToFit];
    }
    return self;
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
    self = [super initWithCoder:aDecoder];
    if (self) {
        [self commonInit];
    }
    return self;
}

- (void)commonInit {
    // Initialization code
    _includeStatusBarInSize = FBSDKIncludeStatusBarInSizeIOS7AndLater;

    // iOS 7 system blue color
    self.backgroundColor = [UIColor colorWithRed:0.0f green:122.0f / 255.0f blue:1.0f alpha:1.0f];
    self.textColor = [UIColor whiteColor];
    self.clipsToBounds = YES;

    [self initViews];
}

- (void)initViews {
    if (!_labelView && !_closeButton) {
        _closeButton = [UIButton buttonWithType:UIButtonTypeCustom];
        _closeButton.backgroundColor = [UIColor clearColor];
        _closeButton.userInteractionEnabled = YES;
        _closeButton.clipsToBounds = YES;
        _closeButton.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleTopMargin;
        _closeButton.contentMode = UIViewContentModeCenter;
        [_closeButton addTarget:self action:@selector(closeButtonTapped:) forControlEvents:UIControlEventTouchUpInside];

        [self addSubview:_closeButton];

        _labelView = [[UILabel alloc] initWithFrame:CGRectZero];
        _labelView.font = [UIFont systemFontOfSize:[UIFont smallSystemFontSize]];
        _labelView.textColor = [UIColor whiteColor];
        _labelView.backgroundColor = [UIColor clearColor];
        _labelView.textAlignment = NSTextAlignmentCenter;
        _labelView.clipsToBounds = YES;
        [self updateLabelText];
        [self addSubview:_labelView];

        _insideTapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(onTapInside:)];
        _labelView.userInteractionEnabled = YES;
        [_labelView addGestureRecognizer:_insideTapGestureRecognizer];

        [self updateColors];
    }
}

#pragma mark - Layout

- (CGSize)intrinsicContentSize {
    CGSize size = self.bounds.size;
    if (_closed || !self.hasRefererData) {
        size.height = 0.0;
    } else {
        CGSize labelSize = [_labelView sizeThatFits:size];
        size = CGSizeMake(size.width, labelSize.height + 2 * FBSDKMarginY + self.statusBarHeight);
    }
    return size;
}

- (void)layoutSubviews {
    [super layoutSubviews];

    CGRect bounds = self.bounds;

    _labelView.preferredMaxLayoutWidth = _labelView.bounds.size.width;
    CGSize labelSize = [_labelView sizeThatFits:bounds.size];
    _labelView.frame = CGRectMake(FBSDKMarginX,
                                  CGRectGetMaxY(bounds) - labelSize.height - 1.5f * FBSDKMarginY,
                                  CGRectGetMaxX(bounds) - FBSDKCloseButtonWidth - 3 * FBSDKMarginX,
                                  labelSize.height + FBSDKMarginY);

    _closeButton.frame = CGRectMake(CGRectGetMaxX(bounds) - FBSDKCloseButtonWidth - 2 * FBSDKMarginX,
                                    _labelView.center.y - FBSDKCloseButtonHeight / 2.0f - FBSDKMarginY,
                                    FBSDKCloseButtonWidth + 2 * FBSDKMarginX,
                                    FBSDKCloseButtonHeight + 2 * FBSDKMarginY);
}

- (CGSize)sizeThatFits:(CGSize)size {
    if (_closed || !self.hasRefererData) {
        size = CGSizeMake(size.width, 0.0);
    } else {
        CGSize labelSize = [_labelView sizeThatFits:size];
        size = CGSizeMake(size.width, labelSize.height + 2 * FBSDKMarginY + self.statusBarHeight);
    }
    return size;
}

- (CGFloat)statusBarHeight {
    UIApplication *application = [UIApplication sharedApplication];

    BOOL include;
    switch (_includeStatusBarInSize) {
        case FBSDKIncludeStatusBarInSizeAlways:
            include = YES;
            break;
        case FBSDKIncludeStatusBarInSizeIOS7AndLater: {
            float systemVersion = [UIDevice currentDevice].systemVersion.floatValue;
            include = (systemVersion >= 7.0);
            break;
        }
        case FBSDKIncludeStatusBarInSizeNever:
            include = NO;
            break;
    }
    if (include && !application.statusBarHidden) {
        BOOL landscape = UIInterfaceOrientationIsLandscape(application.statusBarOrientation);
        CGRect statusBarFrame = application.statusBarFrame;
        return landscape ? CGRectGetWidth(statusBarFrame) : CGRectGetHeight(statusBarFrame);
    }

    return 0;
}

#pragma mark - Public API

- (void)setIncludeStatusBarInSize:(FBSDKIncludeStatusBarInSize)includeStatusBarInSize {
    _includeStatusBarInSize = includeStatusBarInSize;
    [self setNeedsLayout];
    [self invalidateIntrinsicContentSize];
}

- (void)setTextColor:(UIColor *)textColor {
    _textColor = textColor;
    [self updateColors];
}

- (void)setRefererAppLink:(FBSDKAppLink *)refererAppLink {
    _refererAppLink = refererAppLink;
    [self updateLabelText];
    [self updateHidden];
    [self invalidateIntrinsicContentSize];
}

- (void)setClosed:(BOOL)closed {
    if (_closed != closed) {
        _closed = closed;
        [self updateHidden];
        [self invalidateIntrinsicContentSize];
    }
}

- (void)setHidden:(BOOL)hidden {
    _explicitlyHidden = hidden;
    [self updateHidden];
}

#pragma mark - Private

- (void)updateLabelText {
    NSString *appName = (_refererAppLink && _refererAppLink.targets[0]) ? _refererAppLink.targets[0].appName : nil;
    _labelView.text = [self localizedLabelForReferer:appName];
}

- (void)updateColors {
    UIImage *closeButtonImage = [self drawCloseButtonImageWithColor:_textColor];

    _labelView.textColor = _textColor;
    [_closeButton setImage:closeButtonImage forState:UIControlStateNormal];
}

- (UIImage *)drawCloseButtonImageWithColor:(UIColor *)color {

    UIGraphicsBeginImageContextWithOptions(CGSizeMake(FBSDKCloseButtonWidth, FBSDKCloseButtonHeight), NO, 0.0f);

    CGContextRef context = UIGraphicsGetCurrentContext();

    CGContextSetStrokeColorWithColor(context, color.CGColor);
    CGContextSetFillColorWithColor(context, color.CGColor);

    CGContextSetLineWidth(context, 1.25f);

    CGFloat inset = 0.5f;

    CGContextMoveToPoint(context, inset, inset);
    CGContextAddLineToPoint(context, FBSDKCloseButtonWidth - inset, FBSDKCloseButtonHeight - inset);
    CGContextStrokePath(context);

    CGContextMoveToPoint(context, FBSDKCloseButtonWidth - inset, inset);
    CGContextAddLineToPoint(context, inset, FBSDKCloseButtonHeight - inset);
    CGContextStrokePath(context);

    UIImage *result = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    return result;
}

- (NSString *)localizedLabelForReferer:(NSString *)refererName {
    if (!refererName) {
        return nil;
    }

    NSString *format = NSLocalizedString(@"Touch to return to %1$@", @"Format for the string to return to a calling app.");
    return [NSString stringWithFormat:format, refererName];
}

- (BOOL)hasRefererData {
    return _refererAppLink && _refererAppLink.targets[0];
}

- (void)closeButtonTapped:(id)sender {
    [_delegate returnToRefererViewDidTapInsideCloseButton:self];
}

- (void)onTapInside:(UIGestureRecognizer *)sender {
    [_delegate returnToRefererViewDidTapInsideLink:self link:_refererAppLink];
}

- (void)updateHidden {
    super.hidden = _explicitlyHidden || _closed || !self.hasRefererData;
}

@end

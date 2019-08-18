/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import "BFAppLinkReturnToRefererView.h"

#import "BFAppLink.h"
#import "BFAppLinkTarget.h"

static const CGFloat BFMarginX = 8.5f;
static const CGFloat BFMarginY = 8.5f;

static NSString *const BFRefererAppLink = @"referer_app_link";
static NSString *const BFRefererAppName = @"app_name";
static NSString *const BFRefererUrl = @"url";
static const CGFloat BFCloseButtonWidth = 12.0;
static const CGFloat BFCloseButtonHeight = 12.0;

@interface BFAppLinkReturnToRefererView ()

@property (nonatomic, strong) UILabel *labelView;
@property (nonatomic, strong) UIButton *closeButton;
@property (nonatomic, strong) UITapGestureRecognizer *insideTapGestureRecognizer;

@end

@implementation BFAppLinkReturnToRefererView {
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
    _includeStatusBarInSize = BFIncludeStatusBarInSizeIOS7AndLater;

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
#ifdef __IPHONE_6_0
        _labelView.textAlignment = NSTextAlignmentCenter;
#else
        _labelView.textAlignment = UITextAlignmentCenter;
#endif
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
        size = CGSizeMake(size.width, labelSize.height + 2 * BFMarginY + self.statusBarHeight);
    }
    return size;
}

- (void)layoutSubviews {
    [super layoutSubviews];

    CGRect bounds = self.bounds;

    _labelView.preferredMaxLayoutWidth = _labelView.bounds.size.width;
    CGSize labelSize = [_labelView sizeThatFits:bounds.size];
    _labelView.frame = CGRectMake(BFMarginX,
                                  CGRectGetMaxY(bounds) - labelSize.height - 1.5f * BFMarginY,
                                  CGRectGetMaxX(bounds) - BFCloseButtonWidth - 3 * BFMarginX,
                                  labelSize.height + BFMarginY);

    _closeButton.frame = CGRectMake(CGRectGetMaxX(bounds) - BFCloseButtonWidth - 2 * BFMarginX,
                                    _labelView.center.y - BFCloseButtonHeight / 2.0f - BFMarginY,
                                    BFCloseButtonWidth + 2 * BFMarginX,
                                    BFCloseButtonHeight + 2 * BFMarginY);
}

- (CGSize)sizeThatFits:(CGSize)size {
    if (_closed || !self.hasRefererData) {
        size = CGSizeMake(size.width, 0.0);
    } else {
        CGSize labelSize = [_labelView sizeThatFits:size];
        size = CGSizeMake(size.width, labelSize.height + 2 * BFMarginY + self.statusBarHeight);
    }
    return size;
}

- (CGFloat)statusBarHeight {
    UIApplication *application = [UIApplication sharedApplication];

    BOOL include;
    switch (_includeStatusBarInSize) {
        case BFIncludeStatusBarInSizeAlways:
            include = YES;
            break;
        case BFIncludeStatusBarInSizeIOS7AndLater: {
            float systemVersion = [[[UIDevice currentDevice] systemVersion] floatValue];
            include = (systemVersion >= 7.0);
            break;
        }
        case BFIncludeStatusBarInSizeNever:
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

- (void)setIncludeStatusBarInSize:(BFIncludeStatusBarInSize)includeStatusBarInSize {
    _includeStatusBarInSize = includeStatusBarInSize;
    [self setNeedsLayout];
    [self invalidateIntrinsicContentSize];
}

- (void)setTextColor:(UIColor *)textColor {
    _textColor = textColor;
    [self updateColors];
}

- (void)setRefererAppLink:(BFAppLink *)refererAppLink {
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
    NSString *appName = (_refererAppLink && _refererAppLink.targets[0]) ? [_refererAppLink.targets[0] appName] : nil;
    _labelView.text = [self localizedLabelForReferer:appName];
}

- (void)updateColors {
    UIImage *closeButtonImage = [self drawCloseButtonImageWithColor:_textColor];

    _labelView.textColor = _textColor;
    [_closeButton setImage:closeButtonImage forState:UIControlStateNormal];
}

- (UIImage *)drawCloseButtonImageWithColor:(UIColor *)color {

    UIGraphicsBeginImageContextWithOptions(CGSizeMake(BFCloseButtonWidth, BFCloseButtonHeight), NO, 0.0f);

    CGContextRef context = UIGraphicsGetCurrentContext();

    CGContextSetStrokeColorWithColor(context, [color CGColor]);
    CGContextSetFillColorWithColor(context, [color CGColor]);

    CGContextSetLineWidth(context, 1.25f);

    CGFloat inset = 0.5f;

    CGContextMoveToPoint(context, inset, inset);
    CGContextAddLineToPoint(context, BFCloseButtonWidth - inset, BFCloseButtonHeight - inset);
    CGContextStrokePath(context);

    CGContextMoveToPoint(context, BFCloseButtonWidth - inset, inset);
    CGContextAddLineToPoint(context, inset, BFCloseButtonHeight - inset);
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
    [super setHidden:_explicitlyHidden || _closed || !self.hasRefererData];
}

@end

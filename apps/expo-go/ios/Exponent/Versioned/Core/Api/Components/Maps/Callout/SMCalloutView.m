#import "SMCalloutView.h"

//
// UIView frame helpers - we do a lot of UIView frame fiddling in this class; these functions help keep things readable.
//

@interface UIView (SMFrameAdditions)
@property (nonatomic, assign) CGPoint frameOrigin;
@property (nonatomic, assign) CGSize frameSize;
@property (nonatomic, assign) CGFloat frameX, frameY, frameWidth, frameHeight; // normal rect properties
@property (nonatomic, assign) CGFloat frameLeft, frameTop, frameRight, frameBottom; // these will stretch/shrink the rect
@end

//
// Callout View.
//

#define CALLOUT_DEFAULT_CONTAINER_HEIGHT 44 // height of just the main portion without arrow
#define CALLOUT_SUB_DEFAULT_CONTAINER_HEIGHT 52 // height of just the main portion without arrow (when subtitle is present)
#define CALLOUT_MIN_WIDTH 61 // minimum width of system callout
#define TITLE_HMARGIN 12 // the title/subtitle view's normal horizontal margin from the edges of our callout view or from the accessories
#define TITLE_TOP 11 // the top of the title view when no subtitle is present
#define TITLE_SUB_TOP 4 // the top of the title view when a subtitle IS present
#define TITLE_HEIGHT 21 // title height, fixed
#define SUBTITLE_TOP 28 // the top of the subtitle, when present
#define SUBTITLE_HEIGHT 15 // subtitle height, fixed
#define BETWEEN_ACCESSORIES_MARGIN 7 // margin between accessories when no title/subtitle is present
#define TOP_ANCHOR_MARGIN 13 // all the above measurements assume a bottom anchor! if we're pointing "up" we'll need to add this top margin to everything.
#define COMFORTABLE_MARGIN 10 // when we try to reposition content to be visible, we'll consider this margin around your target rect

NSTimeInterval const kSMCalloutViewRepositionDelayForUIScrollView = 1.0/3.0;

@interface SMCalloutView ()
@property (nonatomic, strong) UIButton *containerView; // for masking and interaction
@property (nonatomic, strong) UILabel *titleLabel, *subtitleLabel;
@property (nonatomic, assign) SMCalloutArrowDirection currentArrowDirection;
@property (nonatomic, assign) BOOL popupCancelled;
@end

@implementation SMCalloutView

+ (SMCalloutView *)platformCalloutView {

    // if you haven't compiled SMClassicCalloutView into your app, then we can't possibly create an instance of it!
    if (!NSClassFromString(@"SMClassicCalloutView"))
        return [SMCalloutView new];

    // ok we have both - so choose the best one based on current platform
    if (floor(NSFoundationVersionNumber) > NSFoundationVersionNumber_iOS_6_1)
        return [SMCalloutView new]; // iOS 7+
    else
        return [NSClassFromString(@"SMClassicCalloutView") new];
}

- (id)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        self.permittedArrowDirection = SMCalloutArrowDirectionDown;
        self.presentAnimation = SMCalloutAnimationBounce;
        self.dismissAnimation = SMCalloutAnimationFade;
        self.backgroundColor = [UIColor clearColor];
        self.containerView = [UIButton new];
        self.containerView.isAccessibilityElement = NO;
        self.isAccessibilityElement = NO;
        self.contentViewInset = UIEdgeInsetsMake(12, 12, 12, 12);

        [self.containerView addTarget:self action:@selector(highlightIfNecessary) forControlEvents:UIControlEventTouchDown | UIControlEventTouchDragInside];
        [self.containerView addTarget:self action:@selector(unhighlightIfNecessary) forControlEvents:UIControlEventTouchDragOutside | UIControlEventTouchCancel | UIControlEventTouchUpOutside | UIControlEventTouchUpInside];
        [self.containerView addTarget:self action:@selector(calloutClicked) forControlEvents:UIControlEventTouchUpInside];
    }
    return self;
}

- (BOOL)supportsHighlighting {
    if (![self.delegate respondsToSelector:@selector(calloutViewClicked:)])
        return NO;
    if ([self.delegate respondsToSelector:@selector(calloutViewShouldHighlight:)])
        return [self.delegate calloutViewShouldHighlight:self];
    return YES;
}

- (void)highlightIfNecessary { if (self.supportsHighlighting) self.backgroundView.highlighted = YES; }
- (void)unhighlightIfNecessary { if (self.supportsHighlighting) self.backgroundView.highlighted = NO; }

- (void)calloutClicked {
    if ([self.delegate respondsToSelector:@selector(calloutViewClicked:)])
        [self.delegate calloutViewClicked:self];
}

- (UIView *)titleViewOrDefault {
    if (self.titleView)
        // if you have a custom title view defined, return that.
        return self.titleView;
    else {
        if (!self.titleLabel) {
            // create a default titleView
            self.titleLabel = [UILabel new];
            self.titleLabel.frameHeight = TITLE_HEIGHT;
            self.titleLabel.opaque = NO;
            self.titleLabel.backgroundColor = [UIColor clearColor];
            self.titleLabel.font = [UIFont systemFontOfSize:17];
            self.titleLabel.textColor = [UIColor blackColor];
        }
        return self.titleLabel;
    }
}

- (UIView *)subtitleViewOrDefault {
    if (self.subtitleView)
        // if you have a custom subtitle view defined, return that.
        return self.subtitleView;
    else {
        if (!self.subtitleLabel) {
            // create a default subtitleView
            self.subtitleLabel = [UILabel new];
            self.subtitleLabel.frameHeight = SUBTITLE_HEIGHT;
            self.subtitleLabel.opaque = NO;
            self.subtitleLabel.backgroundColor = [UIColor clearColor];
            self.subtitleLabel.font = [UIFont systemFontOfSize:12];
            self.subtitleLabel.textColor = [UIColor blackColor];
        }
        return self.subtitleLabel;
    }
}

- (SMCalloutBackgroundView *)backgroundView {
    // create our default background on first access only if it's nil, since you might have set your own background anyway.
    return _backgroundView ? _backgroundView : (_backgroundView = [self defaultBackgroundView]);
}

- (SMCalloutBackgroundView *)defaultBackgroundView {
    return [SMCalloutMaskedBackgroundView new];
}

- (void)rebuildSubviews {
    // remove and re-add our appropriate subviews in the appropriate order
    [self.subviews makeObjectsPerformSelector:@selector(removeFromSuperview)];
    [self.containerView.subviews makeObjectsPerformSelector:@selector(removeFromSuperview)];
    [self setNeedsDisplay];

    [self addSubview:self.backgroundView];
    [self addSubview:self.containerView];

    if (self.contentView) {
        [self.containerView addSubview:self.contentView];
    }
    else {
        if (self.titleViewOrDefault) [self.containerView addSubview:self.titleViewOrDefault];
        if (self.subtitleViewOrDefault) [self.containerView addSubview:self.subtitleViewOrDefault];
    }
    if (self.leftAccessoryView) [self.containerView addSubview:self.leftAccessoryView];
    if (self.rightAccessoryView) [self.containerView addSubview:self.rightAccessoryView];
}

// Accessory margins. Accessories are centered vertically when shorter
// than the callout, otherwise they grow from the upper corner.

- (CGFloat)leftAccessoryVerticalMargin {
    if (self.leftAccessoryView.frameHeight < self.calloutContainerHeight)
        return roundf((self.calloutContainerHeight - self.leftAccessoryView.frameHeight) / 2);
    else
        return 0;
}

- (CGFloat)leftAccessoryHorizontalMargin {
    return fminf(self.leftAccessoryVerticalMargin, TITLE_HMARGIN);
}

- (CGFloat)rightAccessoryVerticalMargin {
    if (self.rightAccessoryView.frameHeight < self.calloutContainerHeight)
        return roundf((self.calloutContainerHeight - self.rightAccessoryView.frameHeight) / 2);
    else
        return 0;
}

- (CGFloat)rightAccessoryHorizontalMargin {
    return fminf(self.rightAccessoryVerticalMargin, TITLE_HMARGIN);
}

- (CGFloat)innerContentMarginLeft {
    if (self.leftAccessoryView)
        return self.leftAccessoryHorizontalMargin + self.leftAccessoryView.frameWidth + TITLE_HMARGIN;
    else
        return self.contentViewInset.left;
}

- (CGFloat)innerContentMarginRight {
    if (self.rightAccessoryView)
        return self.rightAccessoryHorizontalMargin + self.rightAccessoryView.frameWidth + TITLE_HMARGIN;
    else
        return self.contentViewInset.right;
}

- (CGFloat)calloutHeight {
    return self.calloutContainerHeight + self.backgroundView.anchorHeight;
}

- (CGFloat)calloutContainerHeight {
    if (self.contentView)
        return self.contentView.frameHeight + self.contentViewInset.bottom + self.contentViewInset.top;
    else if (self.subtitleView || self.subtitle.length > 0)
        return CALLOUT_SUB_DEFAULT_CONTAINER_HEIGHT;
    else
        return CALLOUT_DEFAULT_CONTAINER_HEIGHT;
}

- (CGSize)sizeThatFits:(CGSize)size {

    // calculate how much non-negotiable space we need to reserve for margin and accessories
    CGFloat margin = self.innerContentMarginLeft + self.innerContentMarginRight;

    // how much room is left for text?
    CGFloat availableWidthForText = size.width - margin - 1;

    // no room for text? then we'll have to squeeze into the given size somehow.
    if (availableWidthForText < 0)
        availableWidthForText = 0;

    CGSize preferredTitleSize = [self.titleViewOrDefault sizeThatFits:CGSizeMake(availableWidthForText, TITLE_HEIGHT)];
    CGSize preferredSubtitleSize = [self.subtitleViewOrDefault sizeThatFits:CGSizeMake(availableWidthForText, SUBTITLE_HEIGHT)];

    // total width we'd like
    CGFloat preferredWidth;

    if (self.contentView) {

        // if we have a content view, then take our preferred size directly from that
        preferredWidth = self.contentView.frameWidth + margin;
    }
    else if (preferredTitleSize.width >= 0.000001 || preferredSubtitleSize.width >= 0.000001) {

        // if we have a title or subtitle, then our assumed margins are valid, and we can apply them
        preferredWidth = fmaxf(preferredTitleSize.width, preferredSubtitleSize.width) + margin;
    }
    else {
        // ok we have no title or subtitle to speak of. In this case, the system callout would actually not display
        // at all! But we can handle it.
        preferredWidth = self.leftAccessoryView.frameWidth + self.rightAccessoryView.frameWidth + self.leftAccessoryHorizontalMargin + self.rightAccessoryHorizontalMargin;

        if (self.leftAccessoryView && self.rightAccessoryView)
            preferredWidth += BETWEEN_ACCESSORIES_MARGIN;
    }

    // ensure we're big enough to fit our graphics!
    preferredWidth = fmaxf(preferredWidth, CALLOUT_MIN_WIDTH);

    // ask to be smaller if we have space, otherwise we'll fit into what we have by truncating the title/subtitle.
    return CGSizeMake(fminf(preferredWidth, size.width), self.calloutHeight);
}

- (CGSize)offsetToContainRect:(CGRect)innerRect inRect:(CGRect)outerRect {
    CGFloat nudgeRight = fmaxf(0, CGRectGetMinX(outerRect) - CGRectGetMinX(innerRect));
    CGFloat nudgeLeft = fminf(0, CGRectGetMaxX(outerRect) - CGRectGetMaxX(innerRect));
    CGFloat nudgeTop = fmaxf(0, CGRectGetMinY(outerRect) - CGRectGetMinY(innerRect));
    CGFloat nudgeBottom = fminf(0, CGRectGetMaxY(outerRect) - CGRectGetMaxY(innerRect));
    return CGSizeMake(nudgeLeft ? nudgeLeft : nudgeRight, nudgeTop ? nudgeTop : nudgeBottom);
}

- (void)presentCalloutFromRect:(CGRect)rect inView:(UIView *)view constrainedToView:(UIView *)constrainedView animated:(BOOL)animated {
    [self presentCalloutFromRect:rect inLayer:view.layer ofView:view constrainedToLayer:constrainedView.layer animated:animated];
}

- (void)presentCalloutFromRect:(CGRect)rect inLayer:(CALayer *)layer constrainedToLayer:(CALayer *)constrainedLayer animated:(BOOL)animated {
    [self presentCalloutFromRect:rect inLayer:layer ofView:nil constrainedToLayer:constrainedLayer animated:animated];
}

// this private method handles both CALayer and UIView parents depending on what's passed.
- (void)presentCalloutFromRect:(CGRect)rect inLayer:(CALayer *)layer ofView:(UIView *)view constrainedToLayer:(CALayer *)constrainedLayer animated:(BOOL)animated {

    // Sanity check: dismiss this callout immediately if it's displayed somewhere
    if (self.layer.superlayer) [self dismissCalloutAnimated:NO];

    // cancel any presenting animation that may be in progress
    [self.layer removeAnimationForKey:@"present"];

    // figure out the constrained view's rect in our popup view's coordinate system
    CGRect constrainedRect = [constrainedLayer convertRect:constrainedLayer.bounds toLayer:layer];

    // apply our edge constraints
    constrainedRect = UIEdgeInsetsInsetRect(constrainedRect, self.constrainedInsets);

    constrainedRect = CGRectInset(constrainedRect, COMFORTABLE_MARGIN, COMFORTABLE_MARGIN);

    // form our subviews based on our content set so far
    [self rebuildSubviews];

    // apply title/subtitle (if present
    self.titleLabel.text = self.title;
    self.subtitleLabel.text = self.subtitle;

    // size the callout to fit the width constraint as best as possible
    self.frameSize = [self sizeThatFits:CGSizeMake(constrainedRect.size.width, self.calloutHeight)];

    // how much room do we have in the constraint box, both above and below our target rect?
    CGFloat topSpace = CGRectGetMinY(rect) - CGRectGetMinY(constrainedRect);
    CGFloat bottomSpace = CGRectGetMaxY(constrainedRect) - CGRectGetMaxY(rect);

    // we prefer to point our arrow down.
    SMCalloutArrowDirection bestDirection = SMCalloutArrowDirectionDown;

    // we'll point it up though if that's the only option you gave us.
    if (self.permittedArrowDirection == SMCalloutArrowDirectionUp)
        bestDirection = SMCalloutArrowDirectionUp;

    // or, if we don't have enough space on the top and have more space on the bottom, and you
    // gave us a choice, then pointing up is the better option.
    if (self.permittedArrowDirection == SMCalloutArrowDirectionAny && topSpace < self.calloutHeight && bottomSpace > topSpace)
        bestDirection = SMCalloutArrowDirectionUp;

    self.currentArrowDirection = bestDirection;

    // we want to point directly at the horizontal center of the given rect. calculate our "anchor point" in terms of our
    // target view's coordinate system. make sure to offset the anchor point as requested if necessary.
    CGFloat anchorX = self.calloutOffset.x + CGRectGetMidX(rect);
    CGFloat anchorY = self.calloutOffset.y + (bestDirection == SMCalloutArrowDirectionDown ? CGRectGetMinY(rect) : CGRectGetMaxY(rect));

    // we prefer to sit centered directly above our anchor
    CGFloat calloutX = roundf(anchorX - self.frameWidth / 2);

    // but not if it's going to get too close to the edge of our constraints
    if (calloutX < constrainedRect.origin.x)
        calloutX = constrainedRect.origin.x;

    if (calloutX > constrainedRect.origin.x+constrainedRect.size.width-self.frameWidth)
        calloutX = constrainedRect.origin.x+constrainedRect.size.width-self.frameWidth;

    // what's the farthest to the left and right that we could point to, given our background image constraints?
    CGFloat minPointX = calloutX + self.backgroundView.anchorMargin;
    CGFloat maxPointX = calloutX + self.frameWidth - self.backgroundView.anchorMargin;

    // we may need to scoot over to the left or right to point at the correct spot
    CGFloat adjustX = 0;
    if (anchorX < minPointX) adjustX = anchorX - minPointX;
    if (anchorX > maxPointX) adjustX = anchorX - maxPointX;

    // add the callout to the given layer (or view if possible, to receive touch events)
    if (view)
        [view addSubview:self];
    else
        [layer addSublayer:self.layer];

    CGPoint calloutOrigin = {
            .x = calloutX + adjustX,
            .y = bestDirection == SMCalloutArrowDirectionDown ? (anchorY - self.calloutHeight) : anchorY
    };

    self.frameOrigin = calloutOrigin;

    // now set the *actual* anchor point for our layer so that our "popup" animation starts from this point.
    CGPoint anchorPoint = [layer convertPoint:CGPointMake(anchorX, anchorY) toLayer:self.layer];

    // pass on the anchor point to our background view so it knows where to draw the arrow
    self.backgroundView.arrowPoint = anchorPoint;

    // adjust it to unit coordinates for the actual layer.anchorPoint property
    anchorPoint.x /= self.frameWidth;
    anchorPoint.y /= self.frameHeight;
    self.layer.anchorPoint = anchorPoint;

    // setting the anchor point moves the view a bit, so we need to reset
    self.frameOrigin = calloutOrigin;

    // make sure our frame is not on half-pixels or else we may be blurry!
    CGFloat scale = [UIScreen mainScreen].scale;
    self.frameX = floorf(self.frameX*scale)/scale;
    self.frameY = floorf(self.frameY*scale)/scale;

    // layout now so we can immediately start animating to the final position if needed
    [self setNeedsLayout];
    [self layoutIfNeeded];

    // if we're outside the bounds of our constraint rect, we'll give our delegate an opportunity to shift us into position.
    // consider both our size and the size of our target rect (which we'll assume to be the size of the content you want to scroll into view.
    CGRect contentRect = CGRectUnion(self.frame, rect);
    CGSize offset = [self offsetToContainRect:contentRect inRect:constrainedRect];

    NSTimeInterval delay = 0;
    self.popupCancelled = NO; // reset this before calling our delegate below

    if ([self.delegate respondsToSelector:@selector(calloutView:delayForRepositionWithSize:)] && !CGSizeEqualToSize(offset, CGSizeZero))
        delay = [self.delegate calloutView:(id)self delayForRepositionWithSize:offset];

    // there's a chance that user code in the delegate method may have called -dismissCalloutAnimated to cancel things; if that
    // happened then we need to bail!
    if (self.popupCancelled) return;

    // now we want to mask our contents to our background view (if requested) to match the iOS 7 style
    self.containerView.layer.mask = self.backgroundView.contentMask;

    // if we need to delay, we don't want to be visible while we're delaying, so hide us in preparation for our popup
    self.hidden = YES;

    // create the appropriate animation, even if we're not animated
    CAAnimation *animation = [self animationWithType:self.presentAnimation presenting:YES];

    // nuke the duration if no animation requested - we'll still need to "run" the animation to get delays and callbacks
    if (!animated)
        animation.duration = 0.0000001; // can't be zero or the animation won't "run"

    animation.beginTime = CACurrentMediaTime() + delay;
    animation.delegate = self;

    [self.layer addAnimation:animation forKey:@"present"];
}

- (void)animationDidStart:(CAAnimation *)anim {
    BOOL presenting = [[anim valueForKey:@"presenting"] boolValue];

    if (presenting) {
        if ([_delegate respondsToSelector:@selector(calloutViewWillAppear:)])
            [_delegate calloutViewWillAppear:(id)self];

        // ok, animation is on, let's make ourselves visible!
        self.hidden = NO;
    }
    else if (!presenting) {
        if ([_delegate respondsToSelector:@selector(calloutViewWillDisappear:)])
            [_delegate calloutViewWillDisappear:(id)self];
    }
}

- (void)animationDidStop:(CAAnimation *)anim finished:(BOOL)finished {
    BOOL presenting = [[anim valueForKey:@"presenting"] boolValue];

    if (presenting && finished) {
        if ([_delegate respondsToSelector:@selector(calloutViewDidAppear:)])
            [_delegate calloutViewDidAppear:(id)self];
    }
    else if (!presenting && finished) {

        [self removeFromParent];
        [self.layer removeAnimationForKey:@"dismiss"];

        if ([_delegate respondsToSelector:@selector(calloutViewDidDisappear:)])
            [_delegate calloutViewDidDisappear:(id)self];
    }
}

- (void)dismissCalloutAnimated:(BOOL)animated {

    // cancel all animations that may be in progress
    [self.layer removeAnimationForKey:@"present"];
    [self.layer removeAnimationForKey:@"dismiss"];

    self.popupCancelled = YES;

    if (animated) {
        CAAnimation *animation = [self animationWithType:self.dismissAnimation presenting:NO];
        animation.delegate = self;
        [self.layer addAnimation:animation forKey:@"dismiss"];
    }
    else {
        [self removeFromParent];
    }
}

- (void)removeFromParent {
    if (self.superview)
        [self removeFromSuperview];
    else {
        // removing a layer from a superlayer causes an implicit fade-out animation that we wish to disable.
        [CATransaction begin];
        [CATransaction setDisableActions:YES];
        [self.layer removeFromSuperlayer];
        [CATransaction commit];
    }
}

- (CAAnimation *)animationWithType:(SMCalloutAnimation)type presenting:(BOOL)presenting {
    CAAnimation *animation = nil;

    if (type == SMCalloutAnimationBounce) {

        CABasicAnimation *fade = [CABasicAnimation animationWithKeyPath:@"opacity"];
        fade.duration = 0.23;
        fade.fromValue = presenting ? @0.0 : @1.0;
        fade.toValue = presenting ? @1.0 : @0.0;
        fade.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];

        CABasicAnimation *bounce = [CABasicAnimation animationWithKeyPath:@"transform.scale"];
        bounce.duration = 0.23;
        bounce.fromValue = presenting ? @0.7 : @1.0;
        bounce.toValue = presenting ? @1.0 : @0.7;
        bounce.timingFunction = [CAMediaTimingFunction functionWithControlPoints:0.59367:0.12066:0.18878:1.5814];

        CAAnimationGroup *group = [CAAnimationGroup animation];
        group.animations = @[fade, bounce];
        group.duration = 0.23;

        animation = group;
    }
    else if (type == SMCalloutAnimationFade) {
        CABasicAnimation *fade = [CABasicAnimation animationWithKeyPath:@"opacity"];
        fade.duration = 1.0/3.0;
        fade.fromValue = presenting ? @0.0 : @1.0;
        fade.toValue = presenting ? @1.0 : @0.0;
        animation = fade;
    }
    else if (type == SMCalloutAnimationStretch) {
        CABasicAnimation *stretch = [CABasicAnimation animationWithKeyPath:@"transform.scale"];
        stretch.duration = 0.1;
        stretch.fromValue = presenting ? @0.0 : @1.0;
        stretch.toValue = presenting ? @1.0 : @0.0;
        animation = stretch;
    }

    // CAAnimation is KVC compliant, so we can store whether we're presenting for lookup in our delegate methods
    [animation setValue:@(presenting) forKey:@"presenting"];

    animation.fillMode = kCAFillModeForwards;
    animation.removedOnCompletion = NO;
    return animation;
}

- (void)layoutSubviews {

    self.containerView.frame = self.bounds;
    self.backgroundView.frame = self.bounds;

    // if we're pointing up, we'll need to push almost everything down a bit
    CGFloat dy = self.currentArrowDirection == SMCalloutArrowDirectionUp ? TOP_ANCHOR_MARGIN : 0;

    self.titleViewOrDefault.frameX = self.innerContentMarginLeft;
    self.titleViewOrDefault.frameY = (self.subtitleView || self.subtitle.length ? TITLE_SUB_TOP : TITLE_TOP) + dy;
    self.titleViewOrDefault.frameWidth = self.frameWidth - self.innerContentMarginLeft - self.innerContentMarginRight;

    self.subtitleViewOrDefault.frameX = self.titleViewOrDefault.frameX;
    self.subtitleViewOrDefault.frameY = SUBTITLE_TOP + dy;
    self.subtitleViewOrDefault.frameWidth = self.titleViewOrDefault.frameWidth;

    self.leftAccessoryView.frameX = self.leftAccessoryHorizontalMargin;
    self.leftAccessoryView.frameY = self.leftAccessoryVerticalMargin + dy;

    self.rightAccessoryView.frameX = self.frameWidth - self.rightAccessoryHorizontalMargin - self.rightAccessoryView.frameWidth;
    self.rightAccessoryView.frameY = self.rightAccessoryVerticalMargin + dy;

    if (self.contentView) {
        self.contentView.frameX = self.innerContentMarginLeft;
        self.contentView.frameY = self.contentViewInset.top + dy;
    }
}

#pragma mark - Accessibility

- (NSInteger)accessibilityElementCount {
    return (!!self.leftAccessoryView + !!self.titleViewOrDefault +
            !!self.subtitleViewOrDefault + !!self.rightAccessoryView);
}

- (id)accessibilityElementAtIndex:(NSInteger)index {
    if (index == 0) {
        return self.leftAccessoryView ? self.leftAccessoryView : self.titleViewOrDefault;
    }
    if (index == 1) {
        return self.leftAccessoryView ? self.titleViewOrDefault : self.subtitleViewOrDefault;
    }
    if (index == 2) {
        return self.leftAccessoryView ? self.subtitleViewOrDefault : self.rightAccessoryView;
    }
    if (index == 3) {
        return self.leftAccessoryView ? self.rightAccessoryView : nil;
    }
    return nil;
}

- (NSInteger)indexOfAccessibilityElement:(id)element {
    if (element == nil) return NSNotFound;
    if (element == self.leftAccessoryView) return 0;
    if (element == self.titleViewOrDefault) {
        return self.leftAccessoryView ? 1 : 0;
    }
    if (element == self.subtitleViewOrDefault) {
        return self.leftAccessoryView ? 2 : 1;
    }
    if (element == self.rightAccessoryView) {
        return self.leftAccessoryView ? 3 : 2;
    }
    return NSNotFound;
}

@end

// import this known "private API" from SMCalloutBackgroundView
@interface SMCalloutBackgroundView (EmbeddedImages)
+ (UIImage *)embeddedImageNamed:(NSString *)name;
@end

//
// Callout Background View.
//

@interface SMCalloutMaskedBackgroundView ()
@property (nonatomic, strong) UIView *containerView, *containerBorderView, *arrowView;
@property (nonatomic, strong) UIImageView *arrowImageView, *arrowHighlightedImageView, *arrowBorderView;
@end

static UIImage *blackArrowImage = nil, *whiteArrowImage = nil, *grayArrowImage = nil;

@implementation SMCalloutMaskedBackgroundView

- (id)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {

        // Here we're mimicking the very particular (and odd) structure of the system callout view.
        // The hierarchy and view/layer values were discovered by inspecting map kit using Reveal.app

        self.containerView = [UIView new];
        self.containerView.backgroundColor = [UIColor whiteColor];
        self.containerView.alpha = 0.96;
        self.containerView.layer.cornerRadius = 8;
        self.containerView.layer.shadowRadius = 30;
        self.containerView.layer.shadowOpacity = 0.1;

        self.containerBorderView = [UIView new];
        self.containerBorderView.layer.borderColor = [UIColor colorWithWhite:0 alpha:0.1].CGColor;
        self.containerBorderView.layer.borderWidth = 0.5;
        self.containerBorderView.layer.cornerRadius = 8.5;

        if (!blackArrowImage) {
            blackArrowImage = [SMCalloutBackgroundView embeddedImageNamed:@"CalloutArrow"];
            whiteArrowImage = [self image:blackArrowImage withColor:[UIColor whiteColor]];
            grayArrowImage = [self image:blackArrowImage withColor:[UIColor colorWithWhite:0.85 alpha:1]];
        }

        self.anchorHeight = 13;
        self.anchorMargin = 27;

        self.arrowView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, blackArrowImage.size.width, blackArrowImage.size.height)];
        self.arrowView.alpha = 0.96;
        self.arrowImageView = [[UIImageView alloc] initWithImage:whiteArrowImage];
        self.arrowHighlightedImageView = [[UIImageView alloc] initWithImage:grayArrowImage];
        self.arrowHighlightedImageView.hidden = YES;
        self.arrowBorderView = [[UIImageView alloc] initWithImage:blackArrowImage];
        self.arrowBorderView.alpha = 0.1;
        self.arrowBorderView.frameY = 0.5;

        [self addSubview:self.containerView];
        [self.containerView addSubview:self.containerBorderView];
        [self addSubview:self.arrowView];
        [self.arrowView addSubview:self.arrowBorderView];
        [self.arrowView addSubview:self.arrowImageView];
        [self.arrowView addSubview:self.arrowHighlightedImageView];
    }
    return self;
}

// Make sure we relayout our images when our arrow point changes!
- (void)setArrowPoint:(CGPoint)arrowPoint {
    [super setArrowPoint:arrowPoint];
    [self setNeedsLayout];
}

- (void)setHighlighted:(BOOL)highlighted {
    [super setHighlighted:highlighted];
    self.containerView.backgroundColor = highlighted ? [UIColor colorWithWhite:0.85 alpha:1] : [UIColor whiteColor];
    self.arrowImageView.hidden = highlighted;
    self.arrowHighlightedImageView.hidden = !highlighted;
}

- (UIImage *)image:(UIImage *)image withColor:(UIColor *)color {

    UIGraphicsBeginImageContextWithOptions(image.size, NO, 0);
    CGRect imageRect = (CGRect){.size=image.size};
    CGContextRef c = UIGraphicsGetCurrentContext();
    CGContextTranslateCTM(c, 0, image.size.height);
    CGContextScaleCTM(c, 1, -1);
    CGContextClipToMask(c, imageRect, image.CGImage);
    [color setFill];
    CGContextFillRect(c, imageRect);
    UIImage *whiteImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return whiteImage;
}

- (void)layoutSubviews {

    BOOL pointingUp = self.arrowPoint.y < self.frameHeight/2;

    // if we're pointing up, we'll need to push almost everything down a bit
    CGFloat dy = pointingUp ? TOP_ANCHOR_MARGIN : 0;

    self.containerView.frame = CGRectMake(0, dy, self.frameWidth, self.frameHeight - self.arrowView.frameHeight + 0.5);
    self.containerBorderView.frame = CGRectInset(self.containerView.bounds, -0.5, -0.5);

    self.arrowView.frameX = roundf(self.arrowPoint.x - self.arrowView.frameWidth / 2);

    if (pointingUp) {
        self.arrowView.frameY = 1;
        self.arrowView.transform = CGAffineTransformMakeRotation(M_PI);
    }
    else {
        self.arrowView.frameY = self.containerView.frameHeight - 0.5;
        self.arrowView.transform = CGAffineTransformIdentity;
    }
}

- (CALayer *)contentMask {

    UIGraphicsBeginImageContextWithOptions(self.bounds.size, NO, 0);

    [self.layer renderInContext:UIGraphicsGetCurrentContext()];

    UIImage *maskImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    CALayer *layer = [CALayer layer];
    layer.frame = self.bounds;
    layer.contents = (id)maskImage.CGImage;
    return layer;
}

@end

@implementation SMCalloutBackgroundView

+ (NSData *)dataWithBase64EncodedString:(NSString *)string {
    //
    //  NSData+Base64.m
    //
    //  Version 1.0.2
    //
    //  Created by Nick Lockwood on 12/01/2012.
    //  Copyright (C) 2012 Charcoal Design
    //
    //  Distributed under the permissive zlib License
    //  Get the latest version from here:
    //
    //  https://github.com/nicklockwood/Base64
    //
    //  This software is provided 'as-is', without any express or implied
    //  warranty.  In no event will the authors be held liable for any damages
    //  arising from the use of this software.
    //
    //  Permission is granted to anyone to use this software for any purpose,
    //  including commercial applications, and to alter it and redistribute it
    //  freely, subject to the following restrictions:
    //
    //  1. The origin of this software must not be misrepresented; you must not
    //  claim that you wrote the original software. If you use this software
    //  in a product, an acknowledgment in the product documentation would be
    //  appreciated but is not required.
    //
    //  2. Altered source versions must be plainly marked as such, and must not be
    //  misrepresented as being the original software.
    //
    //  3. This notice may not be removed or altered from any source distribution.
    //
    const char lookup[] = {
            99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
            99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
            99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 62, 99, 99, 99, 63,
            52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 99, 99, 99, 99, 99, 99,
            99,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
            15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 99, 99, 99, 99, 99,
            99, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
            41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 99, 99, 99, 99, 99
    };

    NSData *inputData = [string dataUsingEncoding:NSASCIIStringEncoding allowLossyConversion:YES];
    long long inputLength = [inputData length];
    const unsigned char *inputBytes = [inputData bytes];

    long long maxOutputLength = (inputLength / 4 + 1) * 3;
    NSMutableData *outputData = [NSMutableData dataWithLength:(NSUInteger)maxOutputLength];
    unsigned char *outputBytes = (unsigned char *)[outputData mutableBytes];

    int accumulator = 0;
    long long outputLength = 0;
    unsigned char accumulated[] = {0, 0, 0, 0};
    for (long long i = 0; i < inputLength; i++) {
        unsigned char decoded = lookup[inputBytes[i] & 0x7F];
        if (decoded != 99) {
            accumulated[accumulator] = decoded;
            if (accumulator == 3) {
                outputBytes[outputLength++] = (accumulated[0] << 2) | (accumulated[1] >> 4);
                outputBytes[outputLength++] = (accumulated[1] << 4) | (accumulated[2] >> 2);
                outputBytes[outputLength++] = (accumulated[2] << 6) | accumulated[3];
            }
            accumulator = (accumulator + 1) % 4;
        }
    }

    //handle left-over data
    if (accumulator > 0) outputBytes[outputLength] = (accumulated[0] << 2) | (accumulated[1] >> 4);
    if (accumulator > 1) outputBytes[++outputLength] = (accumulated[1] << 4) | (accumulated[2] >> 2);
    if (accumulator > 2) outputLength++;

    //truncate data to match actual output length
    outputData.length = (NSUInteger)outputLength;
    return outputLength? outputData: nil;
}

+ (UIImage *)embeddedImageNamed:(NSString *)name {
    CGFloat screenScale = [UIScreen mainScreen].scale;
    if (screenScale > 1.0) {
        name = [name stringByAppendingString:@"_2x"];
        screenScale = 2.0;
    }

    SEL selector = NSSelectorFromString(name);

    if (![(id)self respondsToSelector:selector]) {
        NSLog(@"Could not find an embedded image. Ensure that you've added a class-level method named +%@", name);
        return nil;
    }

    // We need to hush the compiler here - but we know what we're doing!
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
    NSString *base64String = [(id)self performSelector:selector];
#pragma clang diagnostic pop

    UIImage *rawImage = [UIImage imageWithData:[self dataWithBase64EncodedString:base64String]];
    return [UIImage imageWithCGImage:rawImage.CGImage scale:screenScale orientation:UIImageOrientationUp];
}

+ (NSString *)CalloutArrow { return @"iVBORw0KGgoAAAANSUhEUgAAACcAAAANCAYAAAAqlHdlAAAAHGlET1QAAAACAAAAAAAAAAcAAAAoAAAABwAAAAYAAADJEgYpIwAAAJVJREFUOBFiYIAAdn5+fkFOTkE5Dg5eW05O3lJOTr6zQPyfDhhoD28pxF5BOZA7gE5ih7oLN8XJyR8MdNwrGjkQaC5/MG7biZDh4OBXBDruLpUdeBdkLhHWE1bCzs6nAnTcUyo58DnIPMK2kqAC6DALIP5JoQNB+i1IsJZ4pcBEm0iJ40D6ibeNDJVAx00k04ETSbUOAAAA//+SwicfAAAAe0lEQVRjYCAdMHNy8u7l5OT7Tzzm3Qu0hpl0q8jQwcPDIwp02B0iHXeHl5dXhAxryNfCzc2tC3TcJwIO/ARSR74tFOjk4uL1BzruHw4H/gPJU2A85Vq5uPjTgY77g+bAPyBxyk2nggkcHPxOnJz8B4AOfAGiQXwqGMsAACGK1kPPMHNBAAAAAElFTkSuQmCC"; }

+ (NSString *)CalloutArrow_2x { return @"iVBORw0KGgoAAAANSUhEUgAAAE4AAAAaCAYAAAAZtWr8AAAACXBIWXMAABYlAAAWJQFJUiTwAAAAHGlET1QAAAACAAAAAAAAAA0AAAAoAAAADQAAAA0AAAFMRh0LGwAAARhJREFUWAnclbENwjAQRZ0mih2fDYgsQEVDxQZMgKjpWYAJkBANI8AGDIEoM0WkzBDRAf8klB44g0OkU1zE3/+9RIpS7VVY730/y/woTWlsjJ9iPcN9pbXfY85auyvm/qcDNmb0e2Z+sk/ZBTthN0oVttX12mJIWeaWEFf+kbySmZQa0msu3nzaGJprTXV3BVLNDG/if7bNOTeAvFP35NGJu39GL7Abb27bFXncVQBZLgJf3jp+ebSWIxZMgrxdvPJoJ4gqHpXgV36ITR46HUGaiNMKB6YQd4lI3gV8qTBjmDhrbQFxVQTyKu4ShjJQap7nE4hrfiiv4Q6B8MLGat1bQNztB/JwZm8Rli5wujFu821xfGZgLPUAAAD//4wvm4gAAAD7SURBVOWXMQ6CMBiFgaFpi6VyBEedXJy4hMQTeBSvRDgJEySegI3EQWOivkZnqUB/k0LyL7R9L++D9G+DwP0TCZGUqCdRlYgUuY9F4JCmqQa0hgBcY7wIItFZMLZYS5l0ruAZbXhs6BIROgmhcoB7OIAHTZUTRqG3wp9xmhqc0aRPQu8YAlwxIbwCEUL6GH9wfDcLXY2HpyvvmkHf9+BcrwCuHQGvNRp9Pl6OY0PPAO42AB7WqMxLKLahpFR7gLv/AA9zPe+gtvAMCIC7WMC7CqEPtrqzmBfHyy3A1V/g1Th27GYBY0BIxrk6Ap65254/VZp30GID9JwteQEZrVMWXqGn8gAAAABJRU5ErkJggg=="; }

@end

//
// Our UIView frame helpers implementation
//

@implementation UIView (SMFrameAdditions)

- (CGPoint)frameOrigin { return self.frame.origin; }
- (void)setFrameOrigin:(CGPoint)origin { self.frame = (CGRect){ .origin=origin, .size=self.frame.size }; }

- (CGFloat)frameX { return self.frame.origin.x; }
- (void)setFrameX:(CGFloat)x { self.frame = (CGRect){ .origin.x=x, .origin.y=self.frame.origin.y, .size=self.frame.size }; }

- (CGFloat)frameY { return self.frame.origin.y; }
- (void)setFrameY:(CGFloat)y { self.frame = (CGRect){ .origin.x=self.frame.origin.x, .origin.y=y, .size=self.frame.size }; }

- (CGSize)frameSize { return self.frame.size; }
- (void)setFrameSize:(CGSize)size { self.frame = (CGRect){ .origin=self.frame.origin, .size=size }; }

- (CGFloat)frameWidth { return self.frame.size.width; }
- (void)setFrameWidth:(CGFloat)width { self.frame = (CGRect){ .origin=self.frame.origin, .size.width=width, .size.height=self.frame.size.height }; }

- (CGFloat)frameHeight { return self.frame.size.height; }
- (void)setFrameHeight:(CGFloat)height { self.frame = (CGRect){ .origin=self.frame.origin, .size.width=self.frame.size.width, .size.height=height }; }

- (CGFloat)frameLeft { return self.frame.origin.x; }
- (void)setFrameLeft:(CGFloat)left { self.frame = (CGRect){ .origin.x=left, .origin.y=self.frame.origin.y, .size.width=fmaxf(self.frame.origin.x+self.frame.size.width-left,0), .size.height=self.frame.size.height }; }

- (CGFloat)frameTop { return self.frame.origin.y; }
- (void)setFrameTop:(CGFloat)top { self.frame = (CGRect){ .origin.x=self.frame.origin.x, .origin.y=top, .size.width=self.frame.size.width, .size.height=fmaxf(self.frame.origin.y+self.frame.size.height-top,0) }; }

- (CGFloat)frameRight { return self.frame.origin.x + self.frame.size.width; }
- (void)setFrameRight:(CGFloat)right { self.frame = (CGRect){ .origin=self.frame.origin, .size.width=fmaxf(right-self.frame.origin.x,0), .size.height=self.frame.size.height }; }

- (CGFloat)frameBottom { return self.frame.origin.y + self.frame.size.height; }
- (void)setFrameBottom:(CGFloat)bottom { self.frame = (CGRect){ .origin=self.frame.origin, .size.width=self.frame.size.width, .size.height=fmaxf(bottom-self.frame.origin.y,0) }; }

@end
#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>

/*

SMCalloutView
-------------
Created by Nick Farina (nfarina@gmail.com)
Version 2.1.2

*/

/// options for which directions the callout is allowed to "point" in.
typedef NS_OPTIONS(NSUInteger, ABI30_0_0SMCalloutArrowDirection) {
    ABI30_0_0SMCalloutArrowDirectionUp = 1 << 0,
    ABI30_0_0SMCalloutArrowDirectionDown = 1 << 1,
    ABI30_0_0SMCalloutArrowDirectionAny = ABI30_0_0SMCalloutArrowDirectionUp | ABI30_0_0SMCalloutArrowDirectionDown
};

/// options for the callout present/dismiss animation
typedef NS_ENUM(NSInteger, ABI30_0_0SMCalloutAnimation) {
    /// the "bounce" animation we all know and love from @c UIAlertView
            ABI30_0_0SMCalloutAnimationBounce,
    /// a simple fade in or out
            ABI30_0_0SMCalloutAnimationFade,
    /// grow or shrink linearly, like in the iPad Calendar app
            ABI30_0_0SMCalloutAnimationStretch
};

NS_ASSUME_NONNULL_BEGIN

/// when delaying our popup in order to scroll content into view, you can use this amount to match the
/// animation duration of UIScrollView when using @c -setContentOffset:animated.
extern NSTimeInterval const kSMCalloutViewRepositionDelayForUIScrollView;

@protocol ABI30_0_0SMCalloutViewDelegate;
@class ABI30_0_0SMCalloutBackgroundView;

//
// Callout view.
//

#if __IPHONE_OS_VERSION_MAX_ALLOWED < 100000
@interface ABI30_0_0SMCalloutView : UIView
#else
@interface ABI30_0_0SMCalloutView : UIView <CAAnimationDelegate>
#endif

@property (nonatomic, weak, nullable) id<ABI30_0_0SMCalloutViewDelegate> delegate;
/// title/titleView relationship mimics UINavigationBar.
@property (nonatomic, copy, nullable) NSString *title;
@property (nonatomic, copy, nullable) NSString *subtitle;

/// Left accessory view for the call out
@property (nonatomic, strong, nullable) UIView *leftAccessoryView;
/// Right accessoty view for the call out
@property (nonatomic, strong, nullable) UIView *rightAccessoryView;
/// Default @c ABI30_0_0SMCalloutArrowDirectionDown
@property (nonatomic, assign) ABI30_0_0SMCalloutArrowDirection permittedArrowDirection;
/// The current arrow direction
@property (nonatomic, readonly) ABI30_0_0SMCalloutArrowDirection currentArrowDirection;
/// if the @c UIView you're constraining to has portions that are overlapped by nav bar, tab bar, etc. you'll need to tell us those insets.
@property (nonatomic, assign) UIEdgeInsets constrainedInsets;
/// default is @c ABI30_0_0SMCalloutMaskedBackgroundView, or @c ABI30_0_0SMCalloutDrawnBackgroundView when using @c ABI30_0_0SMClassicCalloutView
@property (nonatomic, strong) ABI30_0_0SMCalloutBackgroundView *backgroundView;

/**
 @brief Custom title view.
 
 @disucssion Keep in mind that @c ABI30_0_0SMCalloutView calls @c -sizeThatFits on titleView/subtitleView if defined, so your view
 may be resized as a result of that (especially if you're using @c UILabel/UITextField). You may want to subclass and override @c -sizeThatFits, or just wrap your view in a "generic" @c UIView if you do not want it to be auto-sized.
 
 @warning If this is set, the respective @c title property will be ignored.
 */
@property (nonatomic, strong, nullable) UIView *titleView;

/**
 @brief Custom subtitle view.
 
 @discussion Keep in mind that @c ABI30_0_0SMCalloutView calls @c -sizeThatFits on subtitleView if defined, so your view
 may be resized as a result of that (especially if you're using @c UILabel/UITextField). You may want to subclass and override @c -sizeThatFits, or just wrap your view in a "generic" @c UIView if you do not want it to be auto-sized.
 
 @warning If this is set, the respective @c subtitle property will be ignored.
 */
@property (nonatomic, strong, nullable) UIView *subtitleView;

/// Custom "content" view that can be any width/height. If this is set, title/subtitle/titleView/subtitleView are all ignored.
@property (nonatomic, retain, nullable) UIView *contentView;

/// Custom content view margin
@property (nonatomic, assign) UIEdgeInsets contentViewInset;

/// calloutOffset is the offset in screen points from the top-middle of the target view, where the anchor of the callout should be shown.
@property (nonatomic, assign) CGPoint calloutOffset;

/// default ABI30_0_0SMCalloutAnimationBounce, ABI30_0_0SMCalloutAnimationFade respectively
@property (nonatomic, assign) ABI30_0_0SMCalloutAnimation presentAnimation, dismissAnimation;

/// Returns a new instance of ABI30_0_0SMCalloutView if running on iOS 7 or better, otherwise a new instance of ABI30_0_0SMClassicCalloutView if available.
+ (ABI30_0_0SMCalloutView *)platformCalloutView;

/**
 @brief Presents a callout view by adding it to "inView" and pointing at the given rect of inView's bounds.
 
 @discussion Constrains the callout to the bounds of the given view. Optionally scrolls the given rect into view (plus margins)
 if @c -delegate is set and responds to @c -delayForRepositionWithSize.
 
 @param rect @c CGRect to present the view from
 @param view view to 'constrain' the @c constrainedView to
 @param constrainedView @c UIView to be constrainted in @c view
 @param animated @c BOOL if presentation should be animated
 */
- (void)presentCalloutFromRect:(CGRect)rect inView:(UIView *)view constrainedToView:(UIView *)constrainedView animated:(BOOL)animated;

/**
 @brief Present a callout layer in the `layer` and pointing at the given rect of the `layer` bounds
 
 @discussion Same as the view-based presentation, but inserts the callout into a CALayer hierarchy instead.
 @note Be aware that you'll have to direct your own touches to any accessory views, since CALayer doesn't relay touch events.
 
 @param rect @c CGRect to present the view from
 @param layer layer to 'constrain' the @c constrainedLayer to
 @param constrainedLayer @c CALayer to be constrained in @c layer
 @param animated @c BOOL if presentation should be animated
 */
- (void)presentCalloutFromRect:(CGRect)rect inLayer:(CALayer *)layer constrainedToLayer:(CALayer *)constrainedLayer animated:(BOOL)animated;

/**
 Dismiss the callout view
 
 @param animated @c BOOL if dismissal should be animated
 */
- (void)dismissCalloutAnimated:(BOOL)animated;

/// For subclassers. You can override this method to provide your own custom animation for presenting/dismissing the callout.
- (CAAnimation *)animationWithType:(ABI30_0_0SMCalloutAnimation)type presenting:(BOOL)presenting;

@end

//
// Background view - default draws the iOS 7 system background style (translucent white with rounded arrow).
//

/// Abstract base class
@interface ABI30_0_0SMCalloutBackgroundView : UIView
/// indicates where the tip of the arrow should be drawn, as a pixel offset
@property (nonatomic, assign) CGPoint arrowPoint;
/// will be set by the callout when the callout is in a highlighted state
@property (nonatomic, assign) BOOL highlighted;
/// returns an optional layer whose contents should mask the callout view's contents (not honored by @c ABI30_0_0SMClassicCalloutView )
@property (nonatomic, assign) CALayer *contentMask;
/// height of the callout "arrow"
@property (nonatomic, assign) CGFloat anchorHeight;
/// the smallest possible distance from the edge of our control to the "tip" of the anchor, from either left or right
@property (nonatomic, assign) CGFloat anchorMargin;
@end

/// Default for iOS 7, this reproduces the "masked" behavior of the iOS 7-style callout view.
/// Accessories are masked by the shape of the callout (including the arrow itself).
@interface ABI30_0_0SMCalloutMaskedBackgroundView : ABI30_0_0SMCalloutBackgroundView
@end

//
// Delegate methods
//

@protocol ABI30_0_0SMCalloutViewDelegate <NSObject>
@optional

/// Controls whether the callout "highlights" when pressed. default YES. You must also respond to @c -calloutViewClicked below.
/// Not honored by @c ABI30_0_0SMClassicCalloutView.
- (BOOL)calloutViewShouldHighlight:(ABI30_0_0SMCalloutView *)calloutView;

/// Called when the callout view is clicked. Not honored by @c ABI30_0_0SMClassicCalloutView.
- (void)calloutViewClicked:(ABI30_0_0SMCalloutView *)calloutView;

/**
 Called when the callout view detects that it will be outside the constrained view when it appears, 
 or if the target rect was already outside the constrained view. You can implement this selector 
 to respond to this situation by repositioning your content first in order to make everything visible.
 The @c CGSize passed is the calculated offset necessary to make everything visible (plus a nice margin). 
 It expects you to return the amount of time you need to reposition things so the popup can be delayed. 
 Typically you would return @c kSMCalloutViewRepositionDelayForUIScrollView if you're repositioning by calling @c [UIScrollView @c setContentOffset:animated:].
 
 @param calloutView the @c ABI30_0_0SMCalloutView to reposition
 @param offset calculated offset necessary to make everything visible
 @returns @c NSTimeInterval to delay the repositioning
 */
- (NSTimeInterval)calloutView:(ABI30_0_0SMCalloutView *)calloutView delayForRepositionWithSize:(CGSize)offset;

/// Called before the callout view appears on screen, or before the appearance animation will start.
- (void)calloutViewWillAppear:(ABI30_0_0SMCalloutView *)calloutView;

/// Called after the callout view appears on screen, or after the appearance animation is complete.
- (void)calloutViewDidAppear:(ABI30_0_0SMCalloutView *)calloutView;

/// Called before the callout view is removed from the screen, or before the disappearance animation is complete.
- (void)calloutViewWillDisappear:(ABI30_0_0SMCalloutView *)calloutView;

/// Called after the callout view is removed from the screen, or after the disappearance animation is complete.
- (void)calloutViewDidDisappear:(ABI30_0_0SMCalloutView *)calloutView;

NS_ASSUME_NONNULL_END
@end

//
//  LOTAnimationView
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/14/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//  Dream Big.

#import <Foundation/Foundation.h>
#import "LOTAnimationView_Compat.h"
#import "LOTComposition.h"
#import "LOTKeypath.h"
#import "LOTValueDelegate.h"

typedef void (^LOTAnimationCompletionBlock)(BOOL animationFinished);

@interface LOTAnimationView : LOTView

/// Load animation by name from the default bundle, Images are also loaded from the bundle
+ (nonnull instancetype)animationNamed:(nonnull NSString *)animationName NS_SWIFT_NAME(init(name:));

/// Loads animation by name from specified bundle, Images are also loaded from the bundle
+ (nonnull instancetype)animationNamed:(nonnull NSString *)animationName inBundle:(nonnull NSBundle *)bundle NS_SWIFT_NAME(init(name:bundle:));

/// Creates an animation from the deserialized JSON Dictionary
+ (nonnull instancetype)animationFromJSON:(nonnull NSDictionary *)animationJSON NS_SWIFT_NAME(init(json:));

/// Loads an animation from a specific file path. WARNING Do not use a web URL for file path.
+ (nonnull instancetype)animationWithFilePath:(nonnull NSString *)filePath NS_SWIFT_NAME(init(filePath:));

/// Creates an animation from the deserialized JSON Dictionary, images are loaded from the specified bundle
+ (nonnull instancetype)animationFromJSON:(nullable NSDictionary *)animationJSON inBundle:(nullable NSBundle *)bundle NS_SWIFT_NAME(init(json:bundle:));

/// Creates an animation from the LOTComposition, images are loaded from the specified bundle
- (nonnull instancetype)initWithModel:(nullable LOTComposition *)model inBundle:(nullable NSBundle *)bundle;

/// Loads animation asynchronously from the specified URL
- (nonnull instancetype)initWithContentsOfURL:(nonnull NSURL *)url;

/// Set animation name from Interface Builder
@property (nonatomic, strong) IBInspectable NSString * _Nullable animation;

/// Load animation by name from the default bundle. Use when loading LOTAnimationView via Interface Builder.
- (void)setAnimationNamed:(nonnull NSString *)animationName NS_SWIFT_NAME(setAnimation(named:));
  
/// Load animation by name from a specific bundle.
- (void)setAnimationNamed:(nonnull NSString *)animationName inBundle:(nullable NSBundle *)bundle  NS_SWIFT_NAME(setAnimation(named:bundle:));

/// Load animation from a JSON dictionary
- (void)setAnimationFromJSON:(nonnull NSDictionary *)animationJSON NS_SWIFT_NAME(setAnimation(json:));

/// Load animation from a JSON dictionary from a specific bundle
- (void)setAnimationFromJSON:(nonnull NSDictionary *)animationJSON inBundle:(nullable NSBundle *)bundle NS_SWIFT_NAME(setAnimation(json:bundle:));

/// Flag is YES when the animation is playing
@property (nonatomic, readonly) BOOL isAnimationPlaying;

/// Tells the animation to loop indefinitely. Defaults to NO.
@property (nonatomic, assign) BOOL loopAnimation;

/// The animation will play forward and then backwards if loopAnimation is also YES
@property (nonatomic, assign) BOOL autoReverseAnimation;

/// Sets a progress from 0 - 1 of the animation. If the animation is playing it will stop and the completion block will be called.
/// The current progress of the animation in absolute time.
/// e.g. a value of 0.75 always represents the same point in the animation, regardless of positive
/// or negative speed.
@property (nonatomic, assign) CGFloat animationProgress;

/// Sets the speed of the animation. Accepts a negative value for reversing animation.
@property (nonatomic, assign) CGFloat animationSpeed;

/// Read only of the duration in seconds of the animation at speed of 1
@property (nonatomic, readonly) CGFloat animationDuration;

/// Enables or disables caching of the backing animation model. Defaults to YES
@property (nonatomic, assign) BOOL cacheEnable;

/// Sets a completion block to call when the animation has completed
@property (nonatomic, copy, nullable) LOTAnimationCompletionBlock completionBlock;

/// Set the animation data
@property (nonatomic, strong, nullable) LOTComposition *sceneModel;

/// Sets sholdRasterize to YES on the animation layer to improve compositioning performance when not animating.
/// Note this will not produce crisp results at resolutions above the animations set resolution.
/// Defaults to NO
@property (nonatomic, assign) BOOL shouldRasterizeWhenIdle;

/* 
 * Plays the animation from its current position to a specific progress.
 * The animation will start from its current position.
 * If loopAnimation is YES the animation will loop from start position to toProgress indefinitely.
 * If loopAnimation is NO the animation will stop and the completion block will be called.
 */
- (void)playToProgress:(CGFloat)toProgress
        withCompletion:(nullable LOTAnimationCompletionBlock)completion;

/*
 * Plays the animation from specific progress to a specific progress
 * The animation will start from its current position..
 * If loopAnimation is YES the animation will loop from the startProgress to the endProgress indefinitely
 * If loopAnimation is NO the animation will stop and the completion block will be called.
 */
- (void)playFromProgress:(CGFloat)fromStartProgress
              toProgress:(CGFloat)toEndProgress
          withCompletion:(nullable LOTAnimationCompletionBlock)completion;

/*
 * Plays the animation from its current position to a specific frame.
 * The animation will start from its current position.
 * If loopAnimation is YES the animation will loop from beginning to toFrame indefinitely.
 * If loopAnimation is NO the animation will stop and the completion block will be called.
 */
- (void)playToFrame:(nonnull NSNumber *)toFrame
     withCompletion:(nullable LOTAnimationCompletionBlock)completion;

/*
 * Plays the animation from specific frame to a specific frame.
 * The animation will start from its current position.
 * If loopAnimation is YES the animation will loop start frame to end frame indefinitely.
 * If loopAnimation is NO the animation will stop and the completion block will be called.
 */
- (void)playFromFrame:(nonnull NSNumber *)fromStartFrame
              toFrame:(nonnull NSNumber *)toEndFrame
       withCompletion:(nullable LOTAnimationCompletionBlock)completion;


/**
 * Plays the animation from its current position to the end of the animation.
 * The animation will start from its current position.
 * If loopAnimation is YES the animation will loop from beginning to end indefinitely.
 * If loopAnimation is NO the animation will stop and the completion block will be called.
 **/
- (void)playWithCompletion:(nullable LOTAnimationCompletionBlock)completion;

/// Plays the animation
- (void)play;

/// Stops the animation at the current frame. The completion block will be called.
- (void)pause;

/// Stops the animation and rewinds to the beginning. The completion block will be called.
- (void)stop;

/// Sets progress of animation to a specific frame. If the animation is playing it will stop and the completion block will be called.
- (void)setProgressWithFrame:(nonnull NSNumber *)currentFrame;

/// Forces a layout and drawing update for the current frame.
- (void)forceDrawingUpdate;

/// Logs all child keypaths
- (void)logHierarchyKeypaths;

/*!
 @brief Sets a LOTValueDelegate for each animation property returned from the LOTKeypath search. LOTKeypath matches views inside of LOTAnimationView to their After Effects counterparts. The LOTValueDelegate is called every frame as the animation plays to override animation values. A delegate can be any object that conforms to the LOTValueDelegate protocol, or one of the prebuilt delegate classes found in LOTBlockCallback, LOTInterpolatorCallback, and LOTValueCallback.

 @discussion
 Example that sets an animated stroke to Red using a LOTColorValueCallback.
 @code
 LOTKeypath *keypath = [LOTKeypath keypathWithKeys:@"Layer 1", @"Ellipse 1", @"Stroke 1", @"Color", nil];
 LOTColorValueCallback *colorCallback = [LOTColorBlockCallback withColor:[UIColor redColor]];
 [animationView setValueDelegate:colorCallback forKeypath:keypath];
 @endcode

 See the documentation for LOTValueDelegate to see how to create LOTValueCallbacks. A delegate can be any object that conforms to the LOTValueDelegate protocol, or one of the prebuilt delegate classes found in LOTBlockCallback, LOTInterpolatorCallback, and LOTValueCallback.

 See the documentation for LOTKeypath to learn more about how to create keypaths.

 NOTE: The delegate is weakly retained. Be sure that the creator of a delegate is retained.
 Read More at http://airbnb.io/lottie/ios/dynamic.html
 */
- (void)setValueDelegate:(id<LOTValueDelegate> _Nonnull)delegates
              forKeypath:(LOTKeypath * _Nonnull)keypath;

/*!
 @brief returns the string representation of every keypath matching the LOTKeypath search.
 */
- (nullable NSArray *)keysForKeyPath:(nonnull LOTKeypath *)keypath;

/*!
 @brief Converts a CGPoint from the Animation views top coordinate space into the coordinate space of the specified renderable animation node.
 */
- (CGPoint)convertPoint:(CGPoint)point
         toKeypathLayer:(nonnull LOTKeypath *)keypath;

/*!
 @brief Converts a CGRect from the Animation views top coordinate space into the coordinate space of the specified renderable animation node.
 */
- (CGRect)convertRect:(CGRect)rect
       toKeypathLayer:(nonnull LOTKeypath *)keypath;

/*!
 @brief Converts a CGPoint to the Animation views top coordinate space from the coordinate space of the specified renderable animation node.
 */
- (CGPoint)convertPoint:(CGPoint)point
       fromKeypathLayer:(nonnull LOTKeypath *)keypath;

/*!
 @brief Converts a CGRect to the Animation views top coordinate space from the coordinate space of the specified renderable animation node.
 */
- (CGRect)convertRect:(CGRect)rect
     fromKeypathLayer:(nonnull LOTKeypath *)keypath;

/*!
 @brief Adds a UIView, or NSView, to the renderable layer found at the Keypath
 */
- (void)addSubview:(nonnull LOTView *)view
    toKeypathLayer:(nonnull LOTKeypath *)keypath;

/*!
 @brief Adds a UIView, or NSView, to the parent renderable layer found at the Keypath and then masks the view with layer found at the keypath.
 */
- (void)maskSubview:(nonnull LOTView *)view
     toKeypathLayer:(nonnull LOTKeypath *)keypath;

#if !TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
@property (nonatomic) LOTViewContentMode contentMode;
#endif

/*!
 @brief Sets the keyframe value for a specific After Effects property at a given time. NOTE: Deprecated. Use setValueDelegate:forKeypath:
 @discussion NOTE: Deprecated and non functioning. Use setValueDelegate:forKeypath:
 @param value Value is the color, point, or number object that should be set at given time
 @param keypath NSString . separate keypath The Keypath is a dot separated key path that specifies the location of the key to be set from the After Effects file. This will begin with the Layer Name. EG "Layer 1.Shape 1.Fill 1.Color"
 @param frame The frame is the frame to be set. If the keyframe exists it will be overwritten, if it does not exist a new linearly interpolated keyframe will be added
 */
- (void)setValue:(nonnull id)value
      forKeypath:(nonnull NSString *)keypath
         atFrame:(nullable NSNumber *)frame __deprecated;

/*!
 @brief Adds a custom subview to the animation using a LayerName from After Effect as a reference point.
 @discussion NOTE: Deprecated. Use addSubview:toKeypathLayer: or maskSubview:toKeypathLayer:
 @param view The custom view instance to be added

 @param layer The string name of the After Effects layer to be referenced.

 @param applyTransform If YES the custom view will be animated to move with the specified After Effects layer. If NO the custom view will be masked by the After Effects layer
 */
- (void)addSubview:(nonnull LOTView *)view
      toLayerNamed:(nonnull NSString *)layer
    applyTransform:(BOOL)applyTransform __deprecated;

/*!
 @brief Converts the given CGRect from the receiving animation view's coordinate space to the supplied layer's coordinate space If layerName is null then the rect will be converted to the composition coordinate system. This is helpful when adding custom subviews to a LOTAnimationView
 @discussion NOTE: Deprecated. Use convertRect:fromKeypathLayer:
 */
- (CGRect)convertRect:(CGRect)rect
         toLayerNamed:(NSString *_Nullable)layerName __deprecated;

@end

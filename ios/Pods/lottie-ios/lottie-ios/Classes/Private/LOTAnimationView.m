//
//  LOTAnimationView
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/14/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//

#import "LOTAnimationView.h"
#import "LOTPlatformCompat.h"
#import "LOTModels.h"
#import "LOTHelpers.h"
#import "LOTAnimationView_Internal.h"
#import "LOTAnimationCache.h"
#import "LOTCompositionContainer.h"

static NSString * const kCompContainerAnimationKey = @"play";

@implementation LOTAnimationView {
  LOTCompositionContainer *_compContainer;
  NSNumber *_playRangeStartFrame;
  NSNumber *_playRangeEndFrame;
  CGFloat _playRangeStartProgress;
  CGFloat _playRangeEndProgress;
  NSBundle *_bundle;
  CGFloat _animationProgress;
  // Properties for tracking automatic restoration of animation.
  BOOL _shouldRestoreStateWhenAttachedToWindow;
  LOTAnimationCompletionBlock _completionBlockToRestoreWhenAttachedToWindow;
}

# pragma mark - Convenience Initializers

+ (nonnull instancetype)animationNamed:(nonnull NSString *)animationName {
  return [self animationNamed:animationName inBundle:[NSBundle mainBundle]];
}

+ (nonnull instancetype)animationNamed:(nonnull NSString *)animationName inBundle:(nonnull NSBundle *)bundle {
  LOTComposition *comp = [LOTComposition animationNamed:animationName inBundle:bundle];
  return [[self alloc] initWithModel:comp inBundle:bundle];
}

+ (nonnull instancetype)animationFromJSON:(nonnull NSDictionary *)animationJSON {
    return [self animationFromJSON:animationJSON inBundle:[NSBundle mainBundle]];
}

+ (nonnull instancetype)animationFromJSON:(nullable NSDictionary *)animationJSON inBundle:(nullable NSBundle *)bundle {
  LOTComposition *comp = [LOTComposition animationFromJSON:animationJSON inBundle:bundle];
  return [[self alloc] initWithModel:comp inBundle:bundle];
}

+ (nonnull instancetype)animationWithFilePath:(nonnull NSString *)filePath {
  LOTComposition *comp = [LOTComposition animationWithFilePath:filePath];
  return [[self alloc] initWithModel:comp inBundle:[NSBundle mainBundle]];
}

# pragma mark - Initializers

- (instancetype)initWithContentsOfURL:(NSURL *)url {
  self = [self initWithFrame:CGRectZero];
  if (self) {
    LOTComposition *laScene = [[LOTAnimationCache sharedCache] animationForKey:url.absoluteString];
    if (laScene) {
      laScene.cacheKey = url.absoluteString;
      [self _initializeAnimationContainer];
      [self _setupWithSceneModel:laScene];
    } else {
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^(void) {
        NSData *animationData = [NSData dataWithContentsOfURL:url];
        if (!animationData) {
          return;
        }
        NSError *error;
        NSDictionary  *animationJSON = [NSJSONSerialization JSONObjectWithData:animationData
                                                                       options:0 error:&error];
        if (error || !animationJSON) {
          return;
        }
        
        LOTComposition *laScene = [[LOTComposition alloc] initWithJSON:animationJSON withAssetBundle:[NSBundle mainBundle]];
        dispatch_async(dispatch_get_main_queue(), ^(void) {
          [[LOTAnimationCache sharedCache] addAnimation:laScene forKey:url.absoluteString];
          laScene.cacheKey = url.absoluteString;
          [self _initializeAnimationContainer];
          [self _setupWithSceneModel:laScene];
        });
      });
    }
  }
  return self;
}

- (instancetype)initWithModel:(LOTComposition *)model inBundle:(NSBundle *)bundle {
  self = [self initWithFrame:model.compBounds];
  if (self) {
    _bundle = bundle;
    [self _initializeAnimationContainer];
    [self _setupWithSceneModel:model];
  }
  return self;
}

- (instancetype)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    [self _commonInit];
  }
  return self;
}

- (instancetype)initWithCoder:(NSCoder *)coder {
  self = [super initWithCoder:coder];
  if (self) {
    [self _commonInit];
  }
  return self;
}

# pragma mark - Inspectables

- (void)setAnimation:(NSString *)animationName {
    
    _animation = animationName;
    
    [self setAnimationNamed:animationName];
    
}

# pragma mark - Internal Methods

#if TARGET_OS_IPHONE || TARGET_OS_SIMULATOR

- (void)_initializeAnimationContainer {
  self.clipsToBounds = YES;
}

- (void)_commonInit {
  _animationSpeed = 1;
  _animationProgress = 0;
  _loopAnimation = NO;
  _autoReverseAnimation = NO;
  _playRangeEndFrame = nil;
  _playRangeStartFrame = nil;
  _playRangeEndProgress = 0;
  _playRangeStartProgress = 0;
  _shouldRasterizeWhenIdle = NO;
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(_handleWillEnterForeground) name:UIApplicationWillEnterForegroundNotification object:nil];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(_handleWillEnterBackground) name:UIApplicationDidEnterBackgroundNotification object:nil];
}

#else

- (void)_initializeAnimationContainer {
  self.wantsLayer = YES;
}

- (void)_commonInit {
  _animationSpeed = 1;
  _animationProgress = 0;
  _loopAnimation = NO;
  _autoReverseAnimation = NO;
  _playRangeEndFrame = nil;
  _playRangeStartFrame = nil;
  _playRangeEndProgress = 0;
  _playRangeStartProgress = 0;
  _shouldRasterizeWhenIdle = NO;
}

#endif



- (void)dealloc {
  [NSNotificationCenter.defaultCenter removeObserver:self];
}

- (void)_setupWithSceneModel:(LOTComposition *)model {
  if (_sceneModel) {
    [self _removeCurrentAnimationIfNecessary];
    [self _callCompletionIfNecessary:NO];
    [_compContainer removeFromSuperlayer];
    _compContainer = nil;
    _sceneModel = nil;
    [self _commonInit];
  }
  
  _sceneModel = model;
  _compContainer = [[LOTCompositionContainer alloc] initWithModel:nil inLayerGroup:nil withLayerGroup:_sceneModel.layerGroup withAssestGroup:_sceneModel.assetGroup];
  [self.layer addSublayer:_compContainer];
  [self _restoreState];
  [self setNeedsLayout];
}

- (void)_restoreState {
  if (_isAnimationPlaying) {
    _isAnimationPlaying = NO;
    if (_playRangeStartFrame && _playRangeEndFrame) {
      [self playFromFrame:_playRangeStartFrame toFrame:_playRangeEndFrame withCompletion:self.completionBlock];
    } else if (_playRangeEndProgress != _playRangeStartProgress) {
      [self playFromProgress:_playRangeStartProgress toProgress:_playRangeEndProgress withCompletion:self.completionBlock];
    } else {
      [self playWithCompletion:self.completionBlock];
    }
  } else {
    self.animationProgress = _animationProgress;
  }
}

- (void)_removeCurrentAnimationIfNecessary {
  _isAnimationPlaying = NO;
  [_compContainer removeAllAnimations];
  _compContainer.shouldRasterize = _shouldRasterizeWhenIdle;
}

- (CGFloat)_progressForFrame:(NSNumber *)frame {
  if (!_sceneModel) {
    return 0;
  }
  return ((frame.floatValue - _sceneModel.startFrame.floatValue) / (_sceneModel.endFrame.floatValue - _sceneModel.startFrame.floatValue));
}

- (NSNumber *)_frameForProgress:(CGFloat)progress {
  if (!_sceneModel) {
    return @0;
  }
  return @(((_sceneModel.endFrame.floatValue - _sceneModel.startFrame.floatValue) * progress) + _sceneModel.startFrame.floatValue);
}

- (BOOL)_isSpeedNegative {
  // If the animation speed is negative, then we're moving backwards.
  return _animationSpeed >= 0;
}

- (void)_handleWindowChanges:(BOOL)hasNewWindow
{
  // When this view or its superview is leaving the screen, e.g. a modal is presented or another
  // screen is pushed, this method will get called with newWindow value set to nil - indicating that
  // this view will be detached from the visible window.
  // When a view is detached, animations will stop - but will not automatically resumed when it's
  // re-attached back to window, e.g. when the presented modal is dismissed or another screen is
  // pop.
  if (hasNewWindow) {
    // The view is being re-attached, resume animation if needed.
    if (_shouldRestoreStateWhenAttachedToWindow) {
      _shouldRestoreStateWhenAttachedToWindow = NO;
      
      _isAnimationPlaying = YES;
      _completionBlock = _completionBlockToRestoreWhenAttachedToWindow;
      _completionBlockToRestoreWhenAttachedToWindow = nil;
      
      [self performSelector:@selector(_restoreState) withObject:nil afterDelay:0 inModes:@[NSRunLoopCommonModes]];
    }
  } else {
    // The view is being detached, capture information that need to be restored later.
    if (_isAnimationPlaying) {
      [self pause];
      _shouldRestoreStateWhenAttachedToWindow = YES;
      _completionBlockToRestoreWhenAttachedToWindow = _completionBlock;
      _completionBlock = nil;
    }
  }
}

- (void)_handleWillEnterBackground {
  [self _handleWindowChanges: false];
}

- (void)_handleWillEnterForeground {
  [self _handleWindowChanges: (self.window != nil)];
}

# pragma mark - Completion Block

- (void)_callCompletionIfNecessary:(BOOL)complete {
  if (self.completionBlock) {
    LOTAnimationCompletionBlock completion = self.completionBlock;
    self.completionBlock = nil;
    completion(complete);
  }
}

# pragma mark - External Methods

- (void)setAnimationNamed:(nonnull NSString *)animationName {
  LOTComposition *comp = [LOTComposition animationNamed:animationName];

  [self _initializeAnimationContainer];
  [self _setupWithSceneModel:comp];
}

- (void)setAnimationFromJSON:(nonnull NSDictionary *)animationJSON {
  LOTComposition *comp = [LOTComposition animationFromJSON:animationJSON];

  [self _initializeAnimationContainer];
  [self _setupWithSceneModel:comp];
}

# pragma mark - External Methods - Model

- (void)setSceneModel:(LOTComposition *)sceneModel {
  [self _setupWithSceneModel:sceneModel];
}

# pragma mark - External Methods - Play Control

- (void)play {
  if (!_sceneModel) {
    _isAnimationPlaying = YES;
    return;
  }
  [self playFromFrame:_sceneModel.startFrame toFrame:_sceneModel.endFrame withCompletion:nil];
}

- (void)playWithCompletion:(LOTAnimationCompletionBlock)completion {
  if (!_sceneModel) {
    _isAnimationPlaying = YES;
    self.completionBlock = completion;
    return;
  }
  [self playFromFrame:_sceneModel.startFrame toFrame:_sceneModel.endFrame withCompletion:completion];
}

- (void)playToProgress:(CGFloat)progress withCompletion:(nullable LOTAnimationCompletionBlock)completion {
  [self playFromProgress:0 toProgress:progress withCompletion:completion];
}

- (void)playFromProgress:(CGFloat)fromStartProgress
              toProgress:(CGFloat)toEndProgress
          withCompletion:(nullable LOTAnimationCompletionBlock)completion {
  if (!_sceneModel) {
    _isAnimationPlaying = YES;
    self.completionBlock = completion;
    _playRangeStartProgress = fromStartProgress;
    _playRangeEndProgress = toEndProgress;
    return;
  }
  [self playFromFrame:[self _frameForProgress:fromStartProgress]
              toFrame:[self _frameForProgress:toEndProgress]
       withCompletion:completion];
}

- (void)playToFrame:(nonnull NSNumber *)toFrame
     withCompletion:(nullable LOTAnimationCompletionBlock)completion {
  [self playFromFrame:_sceneModel.startFrame toFrame:toFrame withCompletion:completion];
}

- (void)playFromFrame:(nonnull NSNumber *)fromStartFrame
              toFrame:(nonnull NSNumber *)toEndFrame
       withCompletion:(nullable LOTAnimationCompletionBlock)completion {
  if (_isAnimationPlaying) {
    return;
  }
  _playRangeStartFrame = fromStartFrame;
  _playRangeEndFrame = toEndFrame;
  if (completion) {
    self.completionBlock = completion;
  }
  if (!_sceneModel) {
    _isAnimationPlaying = YES;
    return;
  }

  BOOL playingForward = ((_animationSpeed > 0) && (toEndFrame.floatValue > fromStartFrame.floatValue))
    || ((_animationSpeed < 0) && (fromStartFrame.floatValue > toEndFrame.floatValue));

  CGFloat leftFrameValue = MIN(fromStartFrame.floatValue, toEndFrame.floatValue);
  CGFloat rightFrameValue = MAX(fromStartFrame.floatValue, toEndFrame.floatValue);

  NSNumber *currentFrame = [self _frameForProgress:_animationProgress];

  currentFrame = @(MAX(MIN(currentFrame.floatValue, rightFrameValue), leftFrameValue));

  if (currentFrame.floatValue == rightFrameValue && playingForward) {
    currentFrame = @(leftFrameValue);
  } else if (currentFrame.floatValue == leftFrameValue && !playingForward) {
    currentFrame = @(rightFrameValue);
  }
  _animationProgress = [self _progressForFrame:currentFrame];
  
  CGFloat currentProgress = _animationProgress * (_sceneModel.endFrame.floatValue - _sceneModel.startFrame.floatValue);
  CGFloat skipProgress;
  if (playingForward) {
    skipProgress = currentProgress - leftFrameValue;
  } else {
    skipProgress = rightFrameValue - currentProgress;
  }
  NSTimeInterval offset = MAX(0, skipProgress) / _sceneModel.framerate.floatValue;
  if (!self.window) {
    _shouldRestoreStateWhenAttachedToWindow = YES;
    _completionBlockToRestoreWhenAttachedToWindow = self.completionBlock;
    self.completionBlock = nil;
  } else {
    NSTimeInterval duration = (ABS(toEndFrame.floatValue - fromStartFrame.floatValue) / _sceneModel.framerate.floatValue);
    CABasicAnimation *animation = [CABasicAnimation animationWithKeyPath:@"currentFrame"];
    animation.speed = _animationSpeed;
    animation.fromValue = fromStartFrame;
    animation.toValue = toEndFrame;
    animation.duration = duration;
    animation.fillMode = kCAFillModeBoth;
    animation.repeatCount = _loopAnimation ? HUGE_VALF : 1;
    animation.autoreverses = _autoReverseAnimation;
    animation.delegate = self;
    animation.removedOnCompletion = NO;
    if (offset != 0) {
      CFTimeInterval currentTime = CACurrentMediaTime();
      CFTimeInterval currentLayerTime = [self.layer convertTime:currentTime fromLayer:nil];
      animation.beginTime = currentLayerTime - (offset * 1 / _animationSpeed);
    }
    [_compContainer addAnimation:animation forKey:kCompContainerAnimationKey];
    _compContainer.shouldRasterize = NO;
  }
  _isAnimationPlaying = YES;
}

#pragma mark - Other Time Controls

- (void)stop {
  _isAnimationPlaying = NO;
  if (_sceneModel) {
    [self setProgressWithFrame:_sceneModel.startFrame callCompletionIfNecessary:YES];
  }
}

- (void)pause {
  if (!_sceneModel ||
      !_isAnimationPlaying) {
    _isAnimationPlaying = NO;
    return;
  }
  NSNumber *frame = [_compContainer.presentationLayer.currentFrame copy];
  [self setProgressWithFrame:frame callCompletionIfNecessary:YES];
}

- (void)setAnimationProgress:(CGFloat)animationProgress {
  if (!_sceneModel) {
    _animationProgress = animationProgress;
    return;
  }
  [self setProgressWithFrame:[self _frameForProgress:animationProgress] callCompletionIfNecessary:YES];
}

- (void)setProgressWithFrame:(nonnull NSNumber *)currentFrame {
  [self setProgressWithFrame:currentFrame callCompletionIfNecessary:YES];
}

- (void)setProgressWithFrame:(nonnull NSNumber *)currentFrame callCompletionIfNecessary:(BOOL)callCompletion {
  [self _removeCurrentAnimationIfNecessary];

  if (_shouldRestoreStateWhenAttachedToWindow) {
    _shouldRestoreStateWhenAttachedToWindow = NO;

    self.completionBlock = _completionBlockToRestoreWhenAttachedToWindow;
    _completionBlockToRestoreWhenAttachedToWindow = nil;
  }

  _animationProgress = [self _progressForFrame:currentFrame];

  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  _compContainer.currentFrame = currentFrame;
  [_compContainer setNeedsDisplay];
  [CATransaction commit];
  if (callCompletion) {
    [self _callCompletionIfNecessary:NO];
  }
}

- (void)setLoopAnimation:(BOOL)loopAnimation {
  _loopAnimation = loopAnimation;
  if (_isAnimationPlaying && _sceneModel) {
    NSNumber *frame = [_compContainer.presentationLayer.currentFrame copy];
    [self setProgressWithFrame:frame callCompletionIfNecessary:NO];
    [self playFromFrame:_playRangeStartFrame toFrame:_playRangeEndFrame withCompletion:self.completionBlock];
  }
}

- (void)setAnimationSpeed:(CGFloat)animationSpeed {
  _animationSpeed = animationSpeed;
  if (_isAnimationPlaying && _sceneModel) {
    NSNumber *frame = [_compContainer.presentationLayer.currentFrame copy];
    [self setProgressWithFrame:frame callCompletionIfNecessary:NO];
    [self playFromFrame:_playRangeStartFrame toFrame:_playRangeEndFrame withCompletion:self.completionBlock];
  }
}

- (void)forceDrawingUpdate {
  [self _layoutAndForceUpdate];
}

# pragma mark - External Methods - Idle Rasterization

- (void)setShouldRasterizeWhenIdle:(BOOL)shouldRasterize {
  _shouldRasterizeWhenIdle = shouldRasterize;
  if (!_isAnimationPlaying) {
    _compContainer.shouldRasterize = _shouldRasterizeWhenIdle;
  }
}

# pragma mark - External Methods - Cache

- (void)setCacheEnable:(BOOL)cacheEnable {
  _cacheEnable = cacheEnable;
  if (!self.sceneModel.cacheKey) {
    return;
  }
  if (cacheEnable) {
    [[LOTAnimationCache sharedCache] addAnimation:_sceneModel forKey:self.sceneModel.cacheKey];
  } else {
    [[LOTAnimationCache sharedCache] removeAnimationForKey:self.sceneModel.cacheKey];
  }
}

# pragma mark - External Methods - Interactive Controls

- (void)setValueDelegate:(id<LOTValueDelegate> _Nonnull)delegate
              forKeypath:(LOTKeypath * _Nonnull)keypath {
  [_compContainer setValueDelegate:delegate forKeypath:keypath];
  [self _layoutAndForceUpdate];
}

- (nullable NSArray *)keysForKeyPath:(nonnull LOTKeypath *)keypath {
  return [_compContainer keysForKeyPath:keypath];
}

- (CGPoint)convertPoint:(CGPoint)point
         toKeypathLayer:(nonnull LOTKeypath *)keypath {
  [self _layoutAndForceUpdate];
  return [_compContainer convertPoint:point toKeypathLayer:keypath withParentLayer:self.layer];
}

- (CGRect)convertRect:(CGRect)rect
       toKeypathLayer:(nonnull LOTKeypath *)keypath {
  [self _layoutAndForceUpdate];
  return [_compContainer convertRect:rect toKeypathLayer:keypath withParentLayer:self.layer];
}

- (CGPoint)convertPoint:(CGPoint)point
       fromKeypathLayer:(nonnull LOTKeypath *)keypath {
  [self _layoutAndForceUpdate];
  return [_compContainer convertPoint:point fromKeypathLayer:keypath withParentLayer:self.layer];
}

- (CGRect)convertRect:(CGRect)rect
     fromKeypathLayer:(nonnull LOTKeypath *)keypath {
  [self _layoutAndForceUpdate];
  return [_compContainer convertRect:rect fromKeypathLayer:keypath withParentLayer:self.layer];
}

#if TARGET_OS_IPHONE || TARGET_OS_SIMULATOR

- (void)addSubview:(nonnull LOTView *)view
    toKeypathLayer:(nonnull LOTKeypath *)keypath {
  [self _layoutAndForceUpdate];
  CGRect viewRect = view.frame;
  LOTView *wrapperView = [[LOTView alloc] initWithFrame:viewRect];
  view.frame = view.bounds;
  view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [wrapperView addSubview:view];
  [self addSubview:wrapperView];
  [_compContainer addSublayer:wrapperView.layer toKeypathLayer:keypath];
}

- (void)maskSubview:(nonnull LOTView *)view
     toKeypathLayer:(nonnull LOTKeypath *)keypath {
  [self _layoutAndForceUpdate];
  CGRect viewRect = view.frame;
  LOTView *wrapperView = [[LOTView alloc] initWithFrame:viewRect];
  view.frame = view.bounds;
  view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [wrapperView addSubview:view];
  [self addSubview:wrapperView];
  [_compContainer maskSublayer:wrapperView.layer toKeypathLayer:keypath];
}


#else

- (void)addSubview:(nonnull LOTView *)view
    toKeypathLayer:(nonnull LOTKeypath *)keypath {
  [self _layout];
  CGRect viewRect = view.frame;
  LOTView *wrapperView = [[LOTView alloc] initWithFrame:viewRect];
  view.frame = view.bounds;
  view.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
  [wrapperView addSubview:view];
  [self addSubview:wrapperView];
  [_compContainer addSublayer:wrapperView.layer toKeypathLayer:keypath];
}

- (void)maskSubview:(nonnull LOTView *)view
     toKeypathLayer:(nonnull LOTKeypath *)keypath {
  [self _layout];
  CGRect viewRect = view.frame;
  LOTView *wrapperView = [[LOTView alloc] initWithFrame:viewRect];
  view.frame = view.bounds;
  view.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
  [wrapperView addSubview:view];
  [self addSubview:wrapperView];
  [_compContainer maskSublayer:wrapperView.layer toKeypathLayer:keypath];
}

#endif

# pragma mark - Semi-Private Methods

- (CALayer * _Nullable)layerForKey:(NSString * _Nonnull)keyname {
  return _compContainer.childMap[keyname];
}

- (NSArray * _Nonnull)compositionLayers {
  return _compContainer.childLayers;
}

# pragma mark - Getters and Setters

- (CGFloat)animationDuration {
  if (!_sceneModel) {
    return 0;
  }
  CAAnimation *play = [_compContainer animationForKey:kCompContainerAnimationKey];
  if (play) {
    return play.duration;
  }
  return (_sceneModel.endFrame.floatValue - _sceneModel.startFrame.floatValue) / _sceneModel.framerate.floatValue;
}

- (CGFloat)animationProgress {
  if (_isAnimationPlaying &&
      _compContainer.presentationLayer) {
    CGFloat activeProgress = [self _progressForFrame:[(LOTCompositionContainer *)_compContainer.presentationLayer currentFrame]];
    return activeProgress;
  }
  return _animationProgress;
}

# pragma mark - Overrides

#if TARGET_OS_IPHONE || TARGET_OS_SIMULATOR

#define LOTViewContentMode UIViewContentMode
#define LOTViewContentModeScaleToFill UIViewContentModeScaleToFill
#define LOTViewContentModeScaleAspectFit UIViewContentModeScaleAspectFit
#define LOTViewContentModeScaleAspectFill UIViewContentModeScaleAspectFill
#define LOTViewContentModeRedraw UIViewContentModeRedraw
#define LOTViewContentModeCenter UIViewContentModeCenter
#define LOTViewContentModeTop UIViewContentModeTop
#define LOTViewContentModeBottom UIViewContentModeBottom
#define LOTViewContentModeLeft UIViewContentModeLeft
#define LOTViewContentModeRight UIViewContentModeRight
#define LOTViewContentModeTopLeft UIViewContentModeTopLeft
#define LOTViewContentModeTopRight UIViewContentModeTopRight
#define LOTViewContentModeBottomLeft UIViewContentModeBottomLeft
#define LOTViewContentModeBottomRight UIViewContentModeBottomRight

- (CGSize)intrinsicContentSize {
  if (!_sceneModel) {
    return CGSizeMake(UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric);
  }
  return _sceneModel.compBounds.size;
}

- (void)didMoveToSuperview {
  [super didMoveToSuperview];
  if (self.superview == nil) {
    [self _callCompletionIfNecessary:NO];
  }
}

- (void)willMoveToWindow:(UIWindow *)newWindow {
  [self _handleWindowChanges:(newWindow != nil)];
}

- (void)didMoveToWindow {
    _compContainer.rasterizationScale = self.window.screen.scale;
}

- (void)setContentMode:(LOTViewContentMode)contentMode {
  [super setContentMode:contentMode];
  [self setNeedsLayout];
}

- (void)layoutSubviews {
  [super layoutSubviews];
  [self _layout];
}

#else

- (void)viewWillMoveToWindow:(NSWindow *)newWindow {
  [self _handleWindowChanges:(newWindow != nil)];
}

- (void)viewDidMoveToWindow {
    _compContainer.rasterizationScale = self.window.screen.backingScaleFactor;
}
    
- (void)setCompletionBlock:(LOTAnimationCompletionBlock)completionBlock {
    if (completionBlock) {
      _completionBlock = ^(BOOL finished) {
        dispatch_async(dispatch_get_main_queue(), ^{ completionBlock(finished); });
      };
    }
    else {
      _completionBlock = nil;
    }
}

- (void)setContentMode:(LOTViewContentMode)contentMode {
  _contentMode = contentMode;
  [self setNeedsLayout];
}

- (void)setNeedsLayout {
  self.needsLayout = YES;
}

- (BOOL)isFlipped {
  return YES;
}

- (BOOL)wantsUpdateLayer {
  return YES;
}

- (void)layout {
  [super layout];
  [self _layout];
}

#endif

- (void)_layoutAndForceUpdate {
  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  [self _layout];
  [_compContainer displayWithFrame:_compContainer.currentFrame forceUpdate:YES];
  [CATransaction commit];
}

- (void)_layout {
  CGPoint centerPoint = LOT_RectGetCenterPoint(self.bounds);
  CATransform3D xform;

  if (self.contentMode == LOTViewContentModeScaleToFill) {
    CGSize scaleSize = CGSizeMake(self.bounds.size.width / self.sceneModel.compBounds.size.width,
            self.bounds.size.height / self.sceneModel.compBounds.size.height);
    xform = CATransform3DMakeScale(scaleSize.width, scaleSize.height, 1);
  } else if (self.contentMode == LOTViewContentModeScaleAspectFit) {
    CGFloat compAspect = self.sceneModel.compBounds.size.width / self.sceneModel.compBounds.size.height;
    CGFloat viewAspect = self.bounds.size.width / self.bounds.size.height;
    BOOL scaleWidth = compAspect > viewAspect;
    CGFloat dominantDimension = scaleWidth ? self.bounds.size.width : self.bounds.size.height;
    CGFloat compDimension = scaleWidth ? self.sceneModel.compBounds.size.width : self.sceneModel.compBounds.size.height;
    CGFloat scale = dominantDimension / compDimension;
    xform = CATransform3DMakeScale(scale, scale, 1);
  } else if (self.contentMode == LOTViewContentModeScaleAspectFill) {
    CGFloat compAspect = self.sceneModel.compBounds.size.width / self.sceneModel.compBounds.size.height;
    CGFloat viewAspect = self.bounds.size.width / self.bounds.size.height;
    BOOL scaleWidth = compAspect < viewAspect;
    CGFloat dominantDimension = scaleWidth ? self.bounds.size.width : self.bounds.size.height;
    CGFloat compDimension = scaleWidth ? self.sceneModel.compBounds.size.width : self.sceneModel.compBounds.size.height;
    CGFloat scale = dominantDimension / compDimension;
    xform = CATransform3DMakeScale(scale, scale, 1);
  } else {
    xform = CATransform3DIdentity;
  }

  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  _compContainer.transform = CATransform3DIdentity;
  _compContainer.bounds = _sceneModel.compBounds;
  _compContainer.viewportBounds = _sceneModel.compBounds;
  _compContainer.transform = xform;
  _compContainer.position = centerPoint;
  [CATransaction commit];
}

# pragma mark - CAAnimationDelegate

- (void)animationDidStop:(CAAnimation *)anim finished:(BOOL)complete {
  if ([_compContainer animationForKey:kCompContainerAnimationKey] == anim &&
      [anim isKindOfClass:[CABasicAnimation class]]) {
    CABasicAnimation *playAnimation = (CABasicAnimation *)anim;
    NSNumber *frame = _compContainer.presentationLayer.currentFrame;
    if (complete) {
      // Set the final frame based on the animation to/from values. If playing forward, use the
      // toValue otherwise we want to end on the fromValue.
      frame = [self _isSpeedNegative] ? (NSNumber *)playAnimation.toValue : (NSNumber *)playAnimation.fromValue;
    }
    [self _removeCurrentAnimationIfNecessary];
    [self setProgressWithFrame:frame callCompletionIfNecessary:NO];
    [self _callCompletionIfNecessary:complete];
  }
}

# pragma mark - DEPRECATED

- (void)addSubview:(nonnull LOTView *)view
      toLayerNamed:(nonnull NSString *)layer
    applyTransform:(BOOL)applyTransform {
  NSLog(@"%s: Function is DEPRECATED. Please use addSubview:forKeypathLayer:", __PRETTY_FUNCTION__);
  LOTKeypath *keypath = [LOTKeypath keypathWithString:layer];
  if (applyTransform) {
    [self addSubview:view toKeypathLayer:keypath];
  } else {
    [self maskSubview:view toKeypathLayer:keypath];
  }
}

- (CGRect)convertRect:(CGRect)rect
         toLayerNamed:(NSString *_Nullable)layerName {
  NSLog(@"%s: Function is DEPRECATED. Please use convertRect:forKeypathLayer:", __PRETTY_FUNCTION__);
  LOTKeypath *keypath = [LOTKeypath keypathWithString:layerName];
  return [self convertRect:rect toKeypathLayer:keypath];
}

- (void)setValue:(nonnull id)value
      forKeypath:(nonnull NSString *)keypath
         atFrame:(nullable NSNumber *)frame {
  NSLog(@"%s: Function is DEPRECATED and no longer functional. Please use setValueCallback:forKeypath:", __PRETTY_FUNCTION__);
}

- (void)logHierarchyKeypaths {
  NSArray *keypaths = [self keysForKeyPath:[LOTKeypath keypathWithString:@"**"]];
  for (NSString *keypath in keypaths) {
    NSLog(@"%@", keypath);
  }
}

@end

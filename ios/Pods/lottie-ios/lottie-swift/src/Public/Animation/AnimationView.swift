//
//  LottieView.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/23/19.
//

import Foundation
import QuartzCore

/// Describes the behavior of an AnimationView when the app is moved to the background.
public enum LottieBackgroundBehavior {
  /// Stop the animation and reset it to the beginning of its current play time. The completion block is called.
  case stop
  /// Pause the animation in its current state. The completion block is called.
  case pause
  /// Pause the animation and restart it when the application moves to the foreground. The completion block is stored and called when the animation completes.
  case pauseAndRestore
  /// Stops the animation and sets it to the end of its current play time. The completion block is called.
  case forceFinish
}

/// Defines animation loop behavior
public enum LottieLoopMode {
  /// Animation is played once then stops.
  case playOnce
  /// Animation will loop from beginning to end until stopped.
  case loop
  /// Animation will play forward, then backwards and loop until stopped.
  case autoReverse
  /// Animation will loop from beginning to end up to defined amount of times.
  case `repeat`(Float)
  /// Animation will play forward, then backwards a defined amount of times.
  case repeatBackwards(Float)
}

extension LottieLoopMode: Equatable {
  public static func == (lhs: LottieLoopMode, rhs: LottieLoopMode) -> Bool {
    switch (lhs, rhs) {
    case (.repeat(let lhsAmount), .repeat(let rhsAmount)),
         (.repeatBackwards(let lhsAmount), .repeatBackwards(let rhsAmount)):
      return lhsAmount == rhsAmount
    case (.playOnce, .playOnce),
         (.loop, .loop),
         (.autoReverse, .autoReverse):
      return true
    default:
      return false
    }
  }
}

@IBDesignable
final public class AnimationView: LottieView {
  
  // MARK: - Public Properties
  
  /**
   Sets the animation backing the animation view. Setting this will clear the
   view's contents, completion blocks and current state. The new animation will
   be loaded up and set to the beginning of its timeline.
   */
  public var animation: Animation? {
    didSet {
      makeAnimationLayer()
    }
  }
  
  /// Set animation name from Interface Builder
  @IBInspectable var animationName: String? {
    didSet {
      self.animation = animationName.flatMap {
        Animation.named($0, animationCache: nil)
      }
    }
  }
  
  /**
   Describes the behavior of an AnimationView when the app is moved to the background.
   
   The default is `pause` which pauses the animation when the application moves to
   the background. The completion block is called with `false` for completed.
   */
  public var backgroundBehavior: LottieBackgroundBehavior = .pause
  
  /**
   Sets the image provider for the animation view. An image provider provides the
   animation with its required image data.
   
   Setting this will cause the animation to reload its image contents.
   */
  public var imageProvider: AnimationImageProvider {
    didSet {
      reloadImages()
    }
  }
  /**
   Sets the text provider for animation view. A text provider provides the
   animation with values for text layers
   */
   public var textProvider: AnimationTextProvider {
     didSet {
       animationLayer?.textProvider = textProvider
     }
  }
    
    
  /// Returns `true` if the animation is currently playing.
  public var isAnimationPlaying: Bool {
    return animationLayer?.animation(forKey: activeAnimationName) != nil
  }
  
  /// Sets the loop behavior for `play` calls. Defaults to `playOnce`
  public var loopMode: LottieLoopMode = .playOnce {
    didSet {
      updateInFlightAnimation()
    }
  }
  
  /**
   When `true` the animation view will rasterize its contents when not animating.
   Rasterizing will improve performance of static animations.
   
   Note: this will not produce crisp results at resolutions above the animations natural resolution.
   
   Defaults to `false`
   */
  public var shouldRasterizeWhenIdle: Bool = false {
    didSet {
      updateRasterizationState()
    }
  }
  
  /**
   Sets the current animation time with a Progress Time
   
   Note: Setting this will stop the current animation, if any.
   Note 2: If `animation` is nil, setting this will fallback to 0
   */
  public var currentProgress: AnimationProgressTime {
    set {
      if let animation = animation {
        currentFrame = animation.frameTime(forProgress: newValue)
      } else {
        currentFrame = 0
      }
    }
    get {
      if let animation = animation {
        return animation.progressTime(forFrame: currentFrame)
      } else {
        return 0
      }
    }
  }
  
  /**
   Sets the current animation time with a time in seconds.
   
   Note: Setting this will stop the current animation, if any.
   Note 2: If `animation` is nil, setting this will fallback to 0
   */
  public var currentTime: TimeInterval {
    set {
      if let animation = animation {
        currentFrame = animation.frameTime(forTime: newValue)
      } else {
        currentFrame = 0
      }
    }
    get {
      if let animation = animation {
        return animation.time(forFrame: currentFrame)
      } else {
        return 0
      }
    }
  }
  
  /**
   Sets the current animation time with a frame in the animations framerate.
   
   Note: Setting this will stop the current animation, if any.
   */
  public var currentFrame: AnimationFrameTime {
    set {
      removeCurrentAnimation()
      updateAnimationFrame(newValue)
    }
    get {
      return animationLayer?.currentFrame ?? 0
    }
  }
  
  /// Returns the current animation frame while an animation is playing.
  public var realtimeAnimationFrame: AnimationFrameTime {
    return isAnimationPlaying ? animationLayer?.presentation()?.currentFrame ?? currentFrame : currentFrame
  }
  
  /// Returns the current animation frame while an animation is playing.
  public var realtimeAnimationProgress: AnimationProgressTime {
    if let animation = animation {
      return animation.progressTime(forFrame: realtimeAnimationFrame)
    }
    return 0
  }
  
  /// Sets the speed of the animation playback. Defaults to 1
  public var animationSpeed: CGFloat = 1 {
    didSet {
      updateInFlightAnimation()
    }
  }
  
  /**
   When `true` the animation will play back at the framerate encoded in the
   `Animation` model. When `false` the animation will play at the framerate
   of the device.
   
   Defaults to false
   */
  public var respectAnimationFrameRate: Bool = false {
    didSet {
      animationLayer?.respectAnimationFrameRate = respectAnimationFrameRate
    }
  }
  
  /**
   Controls the cropping of an Animation. Setting this property will crop the animation
   to the current views bounds by the viewport frame. The coordinate space is specified
   in the animation's coordinate space.
   
   Animatable.
  */
  public var viewportFrame: CGRect? = nil {
    didSet {
      
      /*
       This is really ugly, but is needed to trigger a layout pass within an animation block.
       Typically this happens automatically, when layout objects are UIView based.
       The animation layer is a CALayer which will not implicitly grab the animation
       duration of a UIView animation block.
       
       By setting bounds and then resetting bounds the UIView animation block's
       duration and curve are captured and added to the layer. This is used in the
       layout block to animate the animationLayer's position and size.
       */
      let rect = bounds
      self.bounds = CGRect.zero
      self.bounds = rect
      self.setNeedsLayout()
    }
  }
  
  // MARK: - Public Functions
  
  /**
   Plays the animation from its current state to the end.
   
   - Parameter completion: An optional completion closure to be called when the animation completes playing.
   */
  public func play(completion: LottieCompletionBlock? = nil) {
    guard let animation = animation else {
      return
    }
    
    /// Build a context for the animation.
    let context = AnimationContext(playFrom: CGFloat(animation.startFrame),
                                   playTo: CGFloat(animation.endFrame),
                                   closure: completion)
    removeCurrentAnimation()
    addNewAnimationForContext(context)
  }
  
  /**
   Plays the animation from a progress (0-1) to a progress (0-1).
   
   - Parameter fromProgress: The start progress of the animation. If `nil` the animation will start at the current progress.
   - Parameter toProgress: The end progress of the animation.
   - Parameter loopMode: The loop behavior of the animation. If `nil` the view's `loopMode` property will be used.
   - Parameter completion: An optional completion closure to be called when the animation stops.
   */
  public func play(fromProgress: AnimationProgressTime? = nil,
                   toProgress: AnimationProgressTime,
                   loopMode: LottieLoopMode? = nil,
                   completion: LottieCompletionBlock? = nil) {
    guard let animation = animation else {
      return
    }
    
    removeCurrentAnimation()
    if let loopMode = loopMode {
      /// Set the loop mode, if one was supplied
      self.loopMode = loopMode
    }
    let context = AnimationContext(playFrom: animation.frameTime(forProgress: fromProgress ?? currentProgress),
                                   playTo: animation.frameTime(forProgress: toProgress),
                                   closure: completion)
    addNewAnimationForContext(context)
  }
  
  /**
   Plays the animation from a start frame to an end frame in the animation's framerate.
   
   - Parameter fromFrame: The start frame of the animation. If `nil` the animation will start at the current frame.
   - Parameter toFrame: The end frame of the animation.
   - Parameter loopMode: The loop behavior of the animation. If `nil` the view's `loopMode` property will be used.
   - Parameter completion: An optional completion closure to be called when the animation stops.
   */
  public func play(fromFrame: AnimationFrameTime? = nil,
                   toFrame: AnimationFrameTime,
                   loopMode: LottieLoopMode? = nil,
                   completion: LottieCompletionBlock? = nil) {
    removeCurrentAnimation()
    if let loopMode = loopMode {
      /// Set the loop mode, if one was supplied
      self.loopMode = loopMode
    }
    
    let context = AnimationContext(playFrom: fromFrame ?? currentProgress,
                                   playTo: toFrame,
                                   closure: completion)
    addNewAnimationForContext(context)
  }
  
  /**
   Plays the animation from a named marker to another marker.
   
   Markers are point in time that are encoded into the Animation data and assigned
   a name.
   
   NOTE: If markers are not found the play command will exit.
   
   - Parameter fromMarker: The start marker for the animation playback. If `nil` the
   animation will start at the current progress.
   - Parameter toMarker: The end marker for the animation playback.
   - Parameter loopMode: The loop behavior of the animation. If `nil` the view's `loopMode` property will be used.
   - Parameter completion: An optional completion closure to be called when the animation stops.
   */
  public func play(fromMarker: String? = nil,
                   toMarker: String,
                   loopMode: LottieLoopMode? = nil,
                   completion: LottieCompletionBlock? = nil) {
    
    guard let animation = animation, let markers = animation.markerMap, let to = markers[toMarker] else {
      return
    }
    
    removeCurrentAnimation()
    if let loopMode = loopMode {
      /// Set the loop mode, if one was supplied
      self.loopMode = loopMode
    }
    
    let fromTime: CGFloat
    if let fromName = fromMarker, let from = markers[fromName] {
      fromTime = CGFloat(from.frameTime)
    } else {
      fromTime = currentFrame
    }
    
    let context = AnimationContext(playFrom: fromTime,
                                   playTo: CGFloat(to.frameTime),
                                   closure: completion)
    addNewAnimationForContext(context)
  }
  
  /**
   Stops the animation and resets the view to its start frame.
   
   The completion closure will be called with `false`
   */
  public func stop() {
    removeCurrentAnimation()
    currentFrame = 0
    CATransaction.flush()
  }
  
  /**
   Pauses the animation in its current state.
   
   The completion closure will be called with `false`
   */
  public func pause() {
    removeCurrentAnimation()
  }
  
  /// Reloads the images supplied to the animation from the `imageProvider`
  public func reloadImages() {
    animationLayer?.reloadImages()
  }
    
  /// Forces the AnimationView to redraw its contents.
  public func forceDisplayUpdate() {
    animationLayer?.forceDisplayUpdate()
  }
  
  // MARK: - Public (Dynamic Properties)
  
  /**
   
   Sets a ValueProvider for the specified keypath. The value provider will be set
   on all properties that match the keypath.
   
   Nearly all properties of a Lottie animation can be changed at runtime using a
   combination of `Animation Keypaths` and `Value Providers`.
   Setting a ValueProvider on a keypath will cause the animation to update its
   contents and read the new Value Provider.
   
   A value provider provides a typed value on a frame by frame basis.
   
   - Parameter valueProvider: The new value provider for the properties.
   - Parameter keypath: The keypath used to search for properties.
   
   Example:
   ```
   /// A keypath that finds the color value for all `Fill 1` nodes.
   let fillKeypath = AnimationKeypath(keypath: "**.Fill 1.Color")
   /// A Color Value provider that returns a reddish color.
   let redValueProvider = ColorValueProvider(Color(r: 1, g: 0.2, b: 0.3, a: 1))
   /// Set the provider on the animationView.
   animationView.setValueProvider(redValueProvider, keypath: fillKeypath)
   ```
   */
  public func setValueProvider(_ valueProvider: AnyValueProvider, keypath: AnimationKeypath) {
    animationLayer?.setValueProvider(valueProvider, keypath: keypath)
  }
  /**
   Reads the value of a property specified by the Keypath.
   Returns nil if no property is found.
   
   - Parameter for: The keypath used to search for the property.
   - Parameter atFrame: The Frame Time of the value to query. If nil then the current frame is used.
   */
  public func getValue(for keypath: AnimationKeypath, atFrame: AnimationFrameTime?) -> Any? {
    return animationLayer?.getValue(for: keypath, atFrame: atFrame)
  }
  
  /// Logs all child keypaths.
  public func logHierarchyKeypaths() {
    animationLayer?.logHierarchyKeypaths()
  }
  
  // MARK: - Public (Add Subview)
  
  /**
   Searches for the nearest child layer to the first Keypath and adds the subview
   to that layer. The subview will move and animate with the child layer.
   Furthermore the subview will be in the child layers coordinate space.
   
   Note: if no layer is found for the keypath, then nothing happens.
   
   - Parameter subview: The subview to add to the found animation layer.
   - Parameter keypath: The keypath used to find the animation layer.
   
   Example:
   ```
   /// A keypath that finds `Layer 1`
   let layerKeypath = AnimationKeypath(keypath: "Layer 1")
   
   /// Wrap the custom view in an `AnimationSubview`
   let subview = AnimationSubview()
   subview.addSubview(customView)
   
   /// Set the provider on the animationView.
   animationView.addSubview(subview, forLayerAt: layerKeypath)
   ```
   */
  public func addSubview(_ subview: AnimationSubview, forLayerAt keypath: AnimationKeypath) {
    guard let sublayer = animationLayer?.layer(for: keypath) else {
      return
    }
    self.setNeedsLayout()
    self.layoutIfNeeded()
    self.forceDisplayUpdate()
    addSubview(subview)
    if let subViewLayer = subview.viewLayer {
      sublayer.addSublayer(subViewLayer)
    }
  }
  
  /**
   Converts a CGRect from the AnimationView's coordinate space into the
   coordinate space of the layer found at Keypath.
   
   If no layer is found, nil is returned
   
   - Parameter rect: The CGRect to convert.
   - Parameter toLayerAt: The keypath used to find the layer.
   */
  public func convert(_ rect: CGRect, toLayerAt keypath: AnimationKeypath?) -> CGRect? {
    guard let animationLayer = animationLayer else { return nil }
    guard let keypath = keypath else {
      return viewLayer?.convert(rect, to: animationLayer)
    }
    guard let sublayer = animationLayer.layer(for: keypath) else {
      return nil
    }
    self.setNeedsLayout()
    self.layoutIfNeeded()
    self.forceDisplayUpdate()
    return animationLayer.convert(rect, to: sublayer)
  }
  
  /**
   Converts a CGPoint from the AnimationView's coordinate space into the
   coordinate space of the layer found at Keypath.
   
   If no layer is found, nil is returned
   
   - Parameter point: The CGPoint to convert.
   - Parameter toLayerAt: The keypath used to find the layer.
   */
  public func convert(_ point: CGPoint, toLayerAt keypath: AnimationKeypath?) -> CGPoint? {
    guard let animationLayer = animationLayer else { return nil }
    guard let keypath = keypath else {
      return viewLayer?.convert(point, to: animationLayer)
    }
    guard let sublayer = animationLayer.layer(for: keypath) else {
      return nil
    }
    self.setNeedsLayout()
    self.layoutIfNeeded()
    self.forceDisplayUpdate()
    return animationLayer.convert(point, to: sublayer)
  }
  
  // MARK: - Public (Animation Contents)
  
  /**
   Sets the enabled state of all animator nodes found with the keypath search.
   This can be used to interactively enable / disable parts of the animation.

   - Parameter isEnabled: When true the animator nodes affect the rendering tree. When false the node is removed from the tree.
   - Parameter keypath: The keypath used to find the node(s).
   */
  public func setNodeIsEnabled(isEnabled: Bool, keypath: AnimationKeypath) {
    guard let animationLayer = animationLayer else { return }
    let nodes = animationLayer.animatorNodes(for: keypath)
    if let nodes = nodes {
      for node in nodes {
        node.isEnabled = isEnabled
      }
      self.forceDisplayUpdate()
    }
  }
  
  // MARK: - Public (Markers)
  
  /**
   Markers are a way to describe a point in time by a key name.
   
   Markers are encoded into animation JSON. By using markers a designer can mark
   playback points for a developer to use without having to worry about keeping
   track of animation frames. If the animation file is updated, the developer
   does not need to update playback code.
   
   Returns the Progress Time for the marker named. Returns nil if no marker found.
   */
  public func progressTime(forMarker named: String) -> AnimationProgressTime? {
    guard let animation = animation else {
      return nil
    }
    return animation.progressTime(forMarker: named)
  }
  
  /**
   Markers are a way to describe a point in time by a key name.
   
   Markers are encoded into animation JSON. By using markers a designer can mark
   playback points for a developer to use without having to worry about keeping
   track of animation frames. If the animation file is updated, the developer
   does not need to update playback code.
   
   Returns the Frame Time for the marker named. Returns nil if no marker found.
   */
  public func frameTime(forMarker named: String) -> AnimationFrameTime? {
    guard let animation = animation else {
      return nil
    }
    return animation.frameTime(forMarker: named)
  }
  
  // MARK: - Public (Initializers)
  
  /// Initializes a LottieView with an animation.
  public init(animation: Animation?, imageProvider: AnimationImageProvider? = nil, textProvider: AnimationTextProvider = DefaultTextProvider()) {
    self.animation = animation
    self.imageProvider = imageProvider ?? BundleImageProvider(bundle: Bundle.main, searchPath: nil)
    self.textProvider = textProvider
    super.init(frame: .zero)
    commonInit()
    makeAnimationLayer()
    if let animation = animation {
      frame = animation.bounds
    }
  }
  
  public init() {
    self.animation = nil
    self.imageProvider = BundleImageProvider(bundle: Bundle.main, searchPath: nil)
    self.textProvider = DefaultTextProvider()
    super.init(frame: .zero)
    commonInit()
  }
  
  public override init(frame: CGRect) {
    self.animation = nil
    self.imageProvider = BundleImageProvider(bundle: Bundle.main, searchPath: nil)
    self.textProvider = DefaultTextProvider()
    super.init(frame: .zero)
    commonInit()
  }
  
  required public init?(coder aDecoder: NSCoder) {
    self.imageProvider = BundleImageProvider(bundle: Bundle.main, searchPath: nil)
    self.textProvider = DefaultTextProvider()
    super.init(coder: aDecoder)
    commonInit()
  }
  
  // MARK: - Public (UIView Overrides)
  
  override public var intrinsicContentSize: CGSize {
    if let animation = animation {
      return animation.bounds.size
    }
    return .zero
  }
  
  override func layoutAnimation() {
    guard let animation = animation, let animationLayer = animationLayer else { return }
    var position = animation.bounds.center
    let xform: CATransform3D
    var shouldForceUpdates: Bool = false
    
    if let viewportFrame = self.viewportFrame {
      shouldForceUpdates = self.contentMode == .redraw
      
      let compAspect = viewportFrame.size.width / viewportFrame.size.height
      let viewAspect = bounds.size.width / bounds.size.height
      let dominantDimension = compAspect > viewAspect ? bounds.size.width : bounds.size.height
      let compDimension = compAspect > viewAspect ? viewportFrame.size.width : viewportFrame.size.height
      let scale = dominantDimension / compDimension
      
      let viewportOffset = animation.bounds.center - viewportFrame.center
      xform = CATransform3DTranslate(CATransform3DMakeScale(scale, scale, 1), viewportOffset.x, viewportOffset.y, 0)
      position = bounds.center
    } else {
      switch contentMode {
      case .scaleToFill:
        position = bounds.center
        xform = CATransform3DMakeScale(bounds.size.width / animation.size.width,
                                       bounds.size.height / animation.size.height,
                                       1);
      case .scaleAspectFit:
        position = bounds.center
        let compAspect = animation.size.width / animation.size.height
        let viewAspect = bounds.size.width / bounds.size.height
        let dominantDimension = compAspect > viewAspect ? bounds.size.width : bounds.size.height
        let compDimension = compAspect > viewAspect ? animation.size.width : animation.size.height
        let scale = dominantDimension / compDimension
        xform = CATransform3DMakeScale(scale, scale, 1)
      case .scaleAspectFill:
        position = bounds.center
        let compAspect = animation.size.width / animation.size.height
        let viewAspect = bounds.size.width / bounds.size.height
        let scaleWidth = compAspect < viewAspect
        let dominantDimension = scaleWidth ? bounds.size.width : bounds.size.height
        let compDimension = scaleWidth ? animation.size.width : animation.size.height
        let scale = dominantDimension / compDimension
        xform = CATransform3DMakeScale(scale, scale, 1)
      case .redraw:
        shouldForceUpdates = true
        xform = CATransform3DIdentity
      case .center:
        position = bounds.center
        xform = CATransform3DIdentity
      case .top:
        position.x = bounds.center.x
        xform = CATransform3DIdentity
      case .bottom:
        position.x = bounds.center.x
        position.y = bounds.maxY - animation.bounds.midY
        xform = CATransform3DIdentity
      case .left:
        position.y = bounds.center.y
        xform = CATransform3DIdentity
      case .right:
        position.y = bounds.center.y
        position.x = bounds.maxX - animation.bounds.midX
        xform = CATransform3DIdentity
      case .topLeft:
        xform = CATransform3DIdentity
      case .topRight:
        position.x = bounds.maxX - animation.bounds.midX
        xform = CATransform3DIdentity
      case .bottomLeft:
        position.y = bounds.maxY - animation.bounds.midY
        xform = CATransform3DIdentity
      case .bottomRight:
        position.x = bounds.maxX - animation.bounds.midX
        position.y = bounds.maxY - animation.bounds.midY
        xform = CATransform3DIdentity
        
        #if os(iOS) || os(tvOS)
      @unknown default:
        print("unsupported contentMode: \(contentMode.rawValue); please update lottie-ios")
        xform = CATransform3DIdentity
        #endif
      }
    }
    
    /*
     UIView Animation does not implicitly set CAAnimation time or timing fuctions.
     If layout is changed in an animation we must get the current animation duration
     and timing function and then manually create a CAAnimation to match the UIView animation.
     If layout is changed without animation, explicitly set animation duration to 0.0
     inside CATransaction to avoid unwanted artifacts.
     */
    /// Check if any animation exist on the view's layer, and match it.
    if let key = viewLayer?.animationKeys()?.first, let animation = viewLayer?.animation(forKey: key) {
      // The layout is happening within an animation block. Grab the animation data.
      
      let positionKey = "LayoutPositionAnimation"
      let transformKey = "LayoutTransformAnimation"
      animationLayer.removeAnimation(forKey: positionKey)
      animationLayer.removeAnimation(forKey: transformKey)
      
      let positionAnimation = animation.copy() as? CABasicAnimation ?? CABasicAnimation(keyPath: "position")
      positionAnimation.keyPath = "position"
      positionAnimation.isAdditive = false
      positionAnimation.fromValue = animationLayer.position
      positionAnimation.toValue = position
      positionAnimation.isRemovedOnCompletion = true
      
      let xformAnimation = animation.copy() as? CABasicAnimation ?? CABasicAnimation(keyPath: "transform")
      xformAnimation.keyPath = "transform"
      xformAnimation.isAdditive = false
      xformAnimation.fromValue = animationLayer.transform
      xformAnimation.toValue = xform
      xformAnimation.isRemovedOnCompletion = true
      
      animationLayer.position = position
      animationLayer.transform = xform
      #if os(OSX)
      animationLayer.anchorPoint = layer?.anchorPoint ?? CGPoint.zero
      #else
      animationLayer.anchorPoint = layer.anchorPoint
      #endif
      animationLayer.add(positionAnimation, forKey: positionKey)
      animationLayer.add(xformAnimation, forKey: transformKey)
    } else {
      CATransaction.begin()
      CATransaction.setAnimationDuration(0.0)
      CATransaction.setAnimationTimingFunction(CAMediaTimingFunction(name: .linear))
      animationLayer.position = position
      animationLayer.transform = xform
      CATransaction.commit()
    }
    
    if shouldForceUpdates {
      animationLayer.forceDisplayUpdate()
    }
  }
  
  // MARK: - Private (Properties)
  
  
  var animationLayer: AnimationContainer? = nil
  
  fileprivate var animationContext: AnimationContext?
  static private let animationName: String = "Lottie"
  fileprivate var activeAnimationName: String = AnimationView.animationName
  fileprivate var animationID: Int = 0
  
  // MARK: - Private (Building Animation View)
  
  fileprivate func makeAnimationLayer() {
    
    /// Remove current animation if any
    removeCurrentAnimation()
    
    if let oldAnimation = self.animationLayer {
      oldAnimation.removeFromSuperlayer()
    }
    
    invalidateIntrinsicContentSize()
    
    guard let animation = animation else {
      return
    }
    
    let animationLayer = AnimationContainer(animation: animation, imageProvider: imageProvider, textProvider: textProvider)
    animationLayer.renderScale = self.screenScale
    viewLayer?.addSublayer(animationLayer)
    self.animationLayer = animationLayer
    reloadImages()
    animationLayer.setNeedsDisplay()
    setNeedsLayout()
    currentFrame = CGFloat(animation.startFrame)
  }
  
  func updateRasterizationState() {
    if isAnimationPlaying {
      animationLayer?.shouldRasterize = false
    } else {
      animationLayer?.shouldRasterize = shouldRasterizeWhenIdle
    }
  }
  
  // MARK: - Private (Animation Playback)
  
  /// Updates the animation frame. Does not affect any current animations
  func updateAnimationFrame(_ newFrame: CGFloat) {
    CATransaction.begin()
    CATransaction.setCompletionBlock {
        self.animationLayer?.forceDisplayUpdate()
    }
    CATransaction.setDisableActions(true)
    animationLayer?.currentFrame = newFrame
    CATransaction.commit()
  }
  
  @objc override func animationWillMoveToBackground() {
    updateAnimationForBackgroundState()
  }
  
  @objc override func animationWillEnterForeground() {
    updateAnimationForForegroundState()
  }
  
  override func animationMovedToWindow() {
    /// Don't update any state if the `superview`  is `nil`
    /// When A viewA owns superViewB, it removes the superViewB from the window. At this point, viewA still owns superViewB and triggers the viewA method: -didmovetowindow
    guard superview != nil else { return }

    if window != nil {
      updateAnimationForForegroundState()
    } else {
      updateAnimationForBackgroundState()
    }
  }
  
  fileprivate func updateAnimationForBackgroundState() {
    if let currentContext = animationContext {
      switch backgroundBehavior {
      case .stop:
        removeCurrentAnimation()
        updateAnimationFrame(currentContext.playFrom)
      case .pause:
        removeCurrentAnimation()
      case .pauseAndRestore:
        currentContext.closure.ignoreDelegate = true
        removeCurrentAnimation()
        /// Keep the stale context around for when the app enters the foreground.
        self.animationContext = currentContext
      case .forceFinish:
        removeCurrentAnimation()
        updateAnimationFrame(currentContext.playTo)
      }
    }
  }
  
  fileprivate var waitingToPlayAnimation: Bool = false
  fileprivate func updateAnimationForForegroundState() {
    if let currentContext = animationContext {
      if waitingToPlayAnimation {
        waitingToPlayAnimation = false
        self.addNewAnimationForContext(currentContext)
      } else if backgroundBehavior == .pauseAndRestore {
        /// Restore animation from saved state
        updateInFlightAnimation()
      }
    }
  }
  
  /// Stops the current in flight animation and freezes the animation in its current state.
  fileprivate func removeCurrentAnimation() {
    guard animationContext != nil else { return }
    let pauseFrame = realtimeAnimationFrame
    animationLayer?.removeAnimation(forKey: activeAnimationName)
    updateAnimationFrame(pauseFrame)
    self.animationContext = nil
  }
  
  /// Updates an in flight animation.
  fileprivate func updateInFlightAnimation() {
    guard let animationContext = animationContext else { return }
    
    guard animationContext.closure.animationState != .complete else {
      // Tried to re-add an already completed animation. Cancel.
      self.animationContext = nil
      return
    }
    
    /// Tell existing context to ignore its closure
    animationContext.closure.ignoreDelegate = true
    
    /// Make a new context, stealing the completion block from the previous.
    let newContext = AnimationContext(playFrom: animationContext.playFrom,
                                      playTo: animationContext.playTo,
                                      closure: animationContext.closure.completionBlock)
    
    /// Remove current animation, and freeze the current frame.
    let pauseFrame = realtimeAnimationFrame
    animationLayer?.removeAnimation(forKey: activeAnimationName)
    animationLayer?.currentFrame = pauseFrame
    
    addNewAnimationForContext(newContext)
  }
  
  /// Adds animation to animation layer and sets the delegate. If animation layer or animation are nil, exits.
  fileprivate func addNewAnimationForContext(_ animationContext: AnimationContext) {
    guard let animationlayer = animationLayer, let animation = animation else {
      return
    }
    
    self.animationContext = animationContext
    
    guard self.window != nil else { waitingToPlayAnimation = true; return }
    
    animationID = animationID + 1
    activeAnimationName = AnimationView.animationName + String(animationID)
    
    /// At this point there is no animation on animationLayer and its state is set.
    
    let framerate = animation.framerate
    
    let playFrom = animationContext.playFrom.clamp(animation.startFrame, animation.endFrame)
    let playTo = animationContext.playTo.clamp(animation.startFrame, animation.endFrame)
    
    let duration = ((max(playFrom, playTo) - min(playFrom, playTo)) / CGFloat(framerate))
    
    let playingForward: Bool =
      ((animationSpeed > 0 && playFrom < playTo) ||
        (animationSpeed < 0 && playTo < playFrom))
    
    var startFrame = currentFrame.clamp(min(playFrom, playTo), max(playFrom, playTo))
    if startFrame == playTo {
      startFrame = playFrom
    }
    
    let timeOffset: TimeInterval = playingForward ?
      Double(startFrame - min(playFrom, playTo)) / framerate :
      Double(max(playFrom, playTo) - startFrame) / framerate
    
    let layerAnimation = CABasicAnimation(keyPath: "currentFrame")
    layerAnimation.fromValue = playFrom
    layerAnimation.toValue = playTo
    layerAnimation.speed = Float(animationSpeed)
    layerAnimation.duration = TimeInterval(duration)
    layerAnimation.fillMode = CAMediaTimingFillMode.both
    
    switch loopMode {
    case .playOnce:
      layerAnimation.repeatCount = 1
    case .loop:
      layerAnimation.repeatCount = HUGE
    case .autoReverse:
      layerAnimation.repeatCount = HUGE
      layerAnimation.autoreverses = true
    case let .repeat(amount):
      layerAnimation.repeatCount = amount
    case let .repeatBackwards(amount):
      layerAnimation.repeatCount = amount
      layerAnimation.autoreverses = true
    }
    
    layerAnimation.isRemovedOnCompletion = false
    if timeOffset != 0 {
      let currentLayerTime = viewLayer?.convertTime(CACurrentMediaTime(), from: nil) ?? 0
      layerAnimation.beginTime = currentLayerTime - (timeOffset * 1 / Double(abs(animationSpeed)))
    }
    layerAnimation.delegate = animationContext.closure
    animationContext.closure.animationLayer = animationlayer
    animationContext.closure.animationKey = activeAnimationName
    
    animationlayer.add(layerAnimation, forKey: activeAnimationName)
    updateRasterizationState()
  }
  
}

//
//  CompatibleAnimationView.swift
//  Lottie_iOS
//
//  Created by Tyler Hedrick on 3/6/19.
//

import Foundation
#if os(iOS) || os(tvOS) || os(watchOS)
import UIKit

/// An Objective-C compatible wrapper around Lottie's Animation class.
/// Use in tandem with CompatibleAnimationView when using Lottie in Objective-C
@objc
public final class CompatibleAnimation: NSObject {

  @objc
  static func named(_ name: String) -> CompatibleAnimation {
    return CompatibleAnimation(name: name)
  }

  @objc
  public init(name: String, bundle: Bundle = Bundle.main) {
    self.name = name
    self.bundle = bundle
    super.init()
  }

  internal var animation: Animation? {
    return Animation.named(name, bundle: bundle)
  }

  // MARK: Private

  private let name: String
  private let bundle: Bundle
}

/// An Objective-C compatible wrapper around Lottie's AnimationView.
@objc
public final class CompatibleAnimationView: UIView {

  @objc
  init(compatibleAnimation: CompatibleAnimation) {
    animationView = AnimationView(animation: compatibleAnimation.animation)
    self.compatibleAnimation = compatibleAnimation
    super.init(frame: .zero)
    commonInit()
  }

  @objc
  public override init(frame: CGRect) {
    animationView = AnimationView()
    super.init(frame: frame)
    commonInit()
  }

  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // MARK: Public

  @objc
  public var compatibleAnimation: CompatibleAnimation? {
    didSet {
      animationView.animation = compatibleAnimation?.animation
    }
  }

  @objc
  public var loopAnimationCount: CGFloat = 0 {
    didSet {
      animationView.loopMode = loopAnimationCount == -1 ? .loop : .repeat(Float(loopAnimationCount))
    }
  }

  @objc
  public override var contentMode: UIView.ContentMode {
    set { animationView.contentMode = newValue }
    get { return animationView.contentMode }
  }

  @objc
  public var shouldRasterizeWhenIdle: Bool {
    set { animationView.shouldRasterizeWhenIdle = newValue }
    get { return animationView.shouldRasterizeWhenIdle }
  }

  @objc
  public var currentProgress: CGFloat {
    set { animationView.currentProgress = newValue }
    get { return animationView.currentProgress }
  }

  @objc
  public var currentTime: TimeInterval {
    set { animationView.currentTime = newValue }
    get { return animationView.currentTime }
  }

  @objc
  public var currentFrame: CGFloat {
    set { animationView.currentFrame = newValue }
    get { return animationView.currentFrame }
  }

  @objc
  public var realtimeAnimationFrame: CGFloat {
    return animationView.realtimeAnimationFrame
  }

  @objc
  public var realtimeAnimationProgress: CGFloat {
    return animationView.realtimeAnimationProgress
  }

  @objc
  public var animationSpeed: CGFloat {
    set { animationView.animationSpeed = newValue }
    get { return animationView.animationSpeed }
  }

  @objc
  public var respectAnimationFrameRate: Bool {
    set { animationView.respectAnimationFrameRate = newValue }
    get { return animationView.respectAnimationFrameRate }
  }

  @objc
  public var isAnimationPlaying: Bool {
    return animationView.isAnimationPlaying
  }

  @objc
  public func play() {
    play(completion: nil)
  }

  @objc
  public func play(completion: ((Bool) -> Void)?) {
    animationView.play(completion: completion)
  }

  @objc
  public func play(
    fromProgress: CGFloat,
    toProgress: CGFloat,
    completion: ((Bool) -> Void)? = nil)
  {
    animationView.play(
      fromProgress: fromProgress,
      toProgress: toProgress,
      loopMode: nil,
      completion: completion)
  }

  @objc
  public func play(
    fromFrame: CGFloat,
    toFrame: CGFloat,
    completion: ((Bool) -> Void)? = nil)
  {
    animationView.play(
      fromFrame: fromFrame,
      toFrame: toFrame,
      loopMode: nil,
      completion: completion)
  }

  @objc
  public func play(
    fromMarker: String,
    toMarker: String,
    completion: ((Bool) -> Void)? = nil)
  {
    animationView.play(
      fromMarker: fromMarker,
      toMarker: toMarker,
      completion: completion)
  }

  @objc
  public func stop() {
    animationView.stop()
  }

  @objc
  public func pause() {
    animationView.pause()
  }

  @objc
  public func reloadImages() {
    animationView.reloadImages()
  }

  @objc
  public func forceDisplayUpdate() {
    animationView.forceDisplayUpdate()
  }

  @objc
  public func getValue(
    for keypath: CompatibleAnimationKeypath,
    atFrame: CGFloat) -> Any?
  {
    return animationView.getValue(
      for: keypath.animationKeypath,
      atFrame: atFrame)
  }

  @objc
  public func logHierarchyKeypaths() {
    animationView.logHierarchyKeypaths()
  }

  @objc
  public func setColorValue(_ color: UIColor, forKeypath keypath: CompatibleAnimationKeypath)
  {
    var red: CGFloat = 0
    var green: CGFloat = 0
    var blue: CGFloat = 0
    var alpha: CGFloat = 0
    // TODO: Fix color spaces
    let colorspace = CGColorSpaceCreateDeviceRGB()

    let convertedColor = color.cgColor.converted(to: colorspace, intent: .defaultIntent, options: nil)

    if let components = convertedColor?.components, components.count == 4 {
      red = components[0]
      green = components[1]
      blue = components[2]
      alpha = components[3]
    } else {
      color.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
    }

    let valueProvider = ColorValueProvider(Color(r: Double(red), g: Double(green), b: Double(blue), a: Double(alpha)))
    animationView.setValueProvider(valueProvider, keypath: keypath.animationKeypath)
  }

  @objc
  public func getColorValue(for keypath: CompatibleAnimationKeypath, atFrame: CGFloat) -> UIColor?
  {
    let value = animationView.getValue(for: keypath.animationKeypath, atFrame: atFrame)
    guard let colorValue = value as? Color else {
        return nil;
    }

    return UIColor(red: CGFloat(colorValue.r), green: CGFloat(colorValue.g), blue: CGFloat(colorValue.b), alpha: CGFloat(colorValue.a))
  }

  @objc
  public func addSubview(
    _ subview: AnimationSubview,
    forLayerAt keypath: CompatibleAnimationKeypath)
  {
    animationView.addSubview(
      subview,
      forLayerAt: keypath.animationKeypath)
  }

  @objc
  public func convert(
    rect: CGRect,
    toLayerAt keypath: CompatibleAnimationKeypath?)
    -> CGRect
  {
    return animationView.convert(
      rect,
      toLayerAt: keypath?.animationKeypath) ?? .zero
  }

  @objc
  public func convert(
    point: CGPoint,
    toLayerAt keypath: CompatibleAnimationKeypath?)
    -> CGPoint
  {
    return animationView.convert(
      point,
      toLayerAt: keypath?.animationKeypath) ?? .zero
  }

  @objc
  public func progressTime(forMarker named: String) -> CGFloat {
    return animationView.progressTime(forMarker: named) ?? 0
  }

  @objc
  public func frameTime(forMarker named: String) -> CGFloat {
    return animationView.frameTime(forMarker: named) ?? 0
  }

  // MARK: Private

  private let animationView: AnimationView

  private func commonInit() {
    translatesAutoresizingMaskIntoConstraints = false
    setUpViews()
  }

  private func setUpViews() {
    animationView.translatesAutoresizingMaskIntoConstraints = false
    addSubview(animationView)
    animationView.topAnchor.constraint(equalTo: topAnchor).isActive = true
    animationView.trailingAnchor.constraint(equalTo: trailingAnchor).isActive = true
    animationView.leadingAnchor.constraint(equalTo: leadingAnchor).isActive = true
    animationView.bottomAnchor.constraint(equalTo: bottomAnchor).isActive = true
  }
}
#endif

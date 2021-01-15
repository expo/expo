//
//  AnimationContainer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/24/19.
//

import Foundation
import QuartzCore

/**
 The base animation container.
 
 This layer holds a single composition container and allows for animation of
 the currentFrame property.
 */
final class AnimationContainer: CALayer {
  
  /// The animatable Current Frame Property
  @NSManaged var currentFrame: CGFloat
  
  var imageProvider: AnimationImageProvider {
    get {
      return layerImageProvider.imageProvider
    }
    set {
      layerImageProvider.imageProvider = newValue
    }
  }
  
  func reloadImages() {
    layerImageProvider.reloadImages()
  }
  
  var renderScale: CGFloat = 1 {
    didSet {
      animationLayers.forEach({ $0.renderScale = renderScale })
    }
  }
  
  public var respectAnimationFrameRate: Bool = false
  
  /// Forces the view to update its drawing.
  func forceDisplayUpdate() {
    animationLayers.forEach( { $0.displayWithFrame(frame: currentFrame, forceUpdates: true) })
  }
  
  func logHierarchyKeypaths() {
    print("Lottie: Logging Animation Keypaths")
    animationLayers.forEach({ $0.logKeypaths(for: nil) })
  }
  
  func setValueProvider(_ valueProvider: AnyValueProvider, keypath: AnimationKeypath) {
    for layer in animationLayers {
      if let foundProperties = layer.nodeProperties(for: keypath) {
        for property in foundProperties {
          property.setProvider(provider: valueProvider)
        }
        layer.displayWithFrame(frame: presentation()?.currentFrame ?? currentFrame, forceUpdates: true)
      }
    }
  }
  
  func getValue(for keypath: AnimationKeypath, atFrame: CGFloat?) -> Any? {
    for layer in animationLayers {
      if let foundProperties = layer.nodeProperties(for: keypath),
        let first = foundProperties.first {
        return first.valueProvider.value(frame: atFrame ?? currentFrame)
      }
    }
    return nil
  }
  
  func layer(for keypath: AnimationKeypath) -> CALayer? {
    for layer in animationLayers {
      if let foundLayer = layer.layer(for: keypath) {
        return foundLayer
      }
    }
    return nil
  }
  
  func animatorNodes(for keypath: AnimationKeypath) -> [AnimatorNode]? {
    var results = [AnimatorNode]()
    for layer in animationLayers {
      if let nodes = layer.animatorNodes(for: keypath) {
        results.append(contentsOf: nodes)
      }
    }
    if results.count == 0 {
      return nil
    }
    return results
  }

  var textProvider: AnimationTextProvider {
    get { return layerTextProvider.textProvider }
    set { layerTextProvider.textProvider = newValue }
  }
  
  var fontProvider: AnimationFontProvider {
    get { return layerFontProvider.fontProvider }
    set { layerFontProvider.fontProvider = newValue }
  }
  
  var animationLayers: ContiguousArray<CompositionLayer>
  fileprivate let layerImageProvider: LayerImageProvider
  fileprivate let layerTextProvider: LayerTextProvider
  fileprivate let layerFontProvider: LayerFontProvider
  
  init(animation: Animation, imageProvider: AnimationImageProvider, textProvider: AnimationTextProvider, fontProvider: AnimationFontProvider) {
    self.layerImageProvider = LayerImageProvider(imageProvider: imageProvider, assets: animation.assetLibrary?.imageAssets)
    self.layerTextProvider = LayerTextProvider(textProvider: textProvider)
    self.layerFontProvider = LayerFontProvider(fontProvider: fontProvider)
    self.animationLayers = []
    super.init()
    bounds = animation.bounds
    let layers = animation.layers.initializeCompositionLayers(assetLibrary: animation.assetLibrary, layerImageProvider: layerImageProvider, textProvider: textProvider, fontProvider: fontProvider, frameRate: CGFloat(animation.framerate))
    
    var imageLayers = [ImageCompositionLayer]()
    var textLayers = [TextCompositionLayer]()
    
    var mattedLayer: CompositionLayer? = nil

    for layer in layers.reversed() {
      layer.bounds = bounds
      animationLayers.append(layer)
      if let imageLayer = layer as? ImageCompositionLayer {
        imageLayers.append(imageLayer)
      }
      if let textLayer = layer as? TextCompositionLayer {
        textLayers.append(textLayer)
      }
      if let matte = mattedLayer {
        /// The previous layer requires this layer to be its matte
        matte.matteLayer = layer
        mattedLayer = nil
        continue
      }
      if let matte = layer.matteType,
        (matte == .add || matte == .invert) {
        /// We have a layer that requires a matte.
        mattedLayer = layer
      }
      addSublayer(layer)
    }
    
    layerImageProvider.addImageLayers(imageLayers)
    layerImageProvider.reloadImages()
    layerTextProvider.addTextLayers(textLayers)
    layerTextProvider.reloadTexts()
    layerFontProvider.addTextLayers(textLayers)
    layerFontProvider.reloadTexts()
    setNeedsDisplay()
  }
  
  /// For CAAnimation Use
  public override init(layer: Any) {
    self.animationLayers = []
    self.layerImageProvider = LayerImageProvider(imageProvider: BlankImageProvider(), assets: nil)
    self.layerTextProvider = LayerTextProvider(textProvider: DefaultTextProvider())
    self.layerFontProvider = LayerFontProvider(fontProvider: DefaultFontProvider())
    super.init(layer: layer)
    
    guard let animationLayer = layer as? AnimationContainer else { return }
    
    currentFrame = animationLayer.currentFrame
    
  }
  
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  // MARK: CALayer Animations
  
  override public class func needsDisplay(forKey key: String) -> Bool {
    if key == "currentFrame" {
      return true
    }
    return super.needsDisplay(forKey: key)
  }
  
  override public func action(forKey event: String) -> CAAction? {
    if event == "currentFrame" {
      let animation = CABasicAnimation(keyPath: event)
      animation.timingFunction = CAMediaTimingFunction(name: CAMediaTimingFunctionName.linear)
      animation.fromValue = self.presentation()?.currentFrame
      return animation
    }
    return super.action(forKey: event)
  }
  
  public override func display() {
    guard Thread.isMainThread else { return }
    var newFrame: CGFloat = self.presentation()?.currentFrame ?? self.currentFrame
    if respectAnimationFrameRate {
      newFrame = floor(newFrame)
    }
    animationLayers.forEach( { $0.displayWithFrame(frame: newFrame, forceUpdates: false) })
  }
  
}

fileprivate class BlankImageProvider: AnimationImageProvider {
  func imageForAsset(asset: ImageAsset) -> CGImage? {
    return nil
  }
}

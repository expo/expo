//
//  PreCompositionLayer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/25/19.
//

import Foundation
import QuartzCore

final class PreCompositionLayer: CompositionLayer {
  
  let frameRate: CGFloat
  let remappingNode: NodeProperty<Vector1D>?
  fileprivate var animationLayers: [CompositionLayer]
  
  init(precomp: PreCompLayerModel,
       asset: PrecompAsset,
       layerImageProvider: LayerImageProvider,
       textProvider: AnimationTextProvider,
       fontProvider: AnimationFontProvider,
       assetLibrary: AssetLibrary?,
       frameRate: CGFloat) {
    self.animationLayers = []
    if let keyframes = precomp.timeRemapping?.keyframes {
      self.remappingNode = NodeProperty(provider: KeyframeInterpolator(keyframes: keyframes))
    } else {
      self.remappingNode = nil
    }
    self.frameRate = frameRate
    super.init(layer: precomp, size: CGSize(width: precomp.width, height: precomp.height))
    contentsLayer.masksToBounds = true
    contentsLayer.bounds = CGRect(origin: .zero, size: CGSize(width: precomp.width, height: precomp.height))
    
    let layers = asset.layers.initializeCompositionLayers(assetLibrary: assetLibrary, layerImageProvider: layerImageProvider, textProvider: textProvider,  fontProvider: fontProvider, frameRate: frameRate)
    
    var imageLayers = [ImageCompositionLayer]()
    
    var mattedLayer: CompositionLayer? = nil
    
    for layer in layers.reversed() {
      layer.bounds = bounds
      animationLayers.append(layer)
      if let imageLayer = layer as? ImageCompositionLayer {
        imageLayers.append(imageLayer)
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
      contentsLayer.addSublayer(layer)
    }
    
    self.childKeypaths.append(contentsOf: layers)
    
    layerImageProvider.addImageLayers(imageLayers)
  }
  
  override init(layer: Any) {
    /// Used for creating shadow model layers. Read More here: https://developer.apple.com/documentation/quartzcore/calayer/1410842-init
    guard let layer = layer as? PreCompositionLayer else {
      fatalError("init(layer:) Wrong Layer Class")
    }
    self.frameRate = layer.frameRate
    self.remappingNode = nil
    self.animationLayers = []
    
    super.init(layer: layer)
  }
  
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override func displayContentsWithFrame(frame: CGFloat, forceUpdates: Bool) {
    let localFrame: CGFloat
    if let remappingNode = remappingNode {
      remappingNode.update(frame: frame)
      localFrame = remappingNode.value.cgFloatValue * frameRate
    } else {
      localFrame = (frame - startFrame) / timeStretch
    }
    animationLayers.forEach( { $0.displayWithFrame(frame: localFrame, forceUpdates: forceUpdates) })
  }
  
  override var keypathProperties: [String : AnyNodeProperty] {
    guard let remappingNode = remappingNode else {
      return super.keypathProperties
    }
    return ["Time Remap" : remappingNode]
  }
  
  override func updateRenderScale() {
    super.updateRenderScale()
    animationLayers.forEach( { $0.renderScale = renderScale } )
  }
}

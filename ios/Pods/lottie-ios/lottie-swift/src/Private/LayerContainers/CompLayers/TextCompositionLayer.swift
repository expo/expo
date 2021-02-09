//
//  TextCompositionLayer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/25/19.
//

import Foundation
import CoreGraphics
import QuartzCore
import CoreText

/// Needed for NSMutableParagraphStyle...
#if os(OSX)
import AppKit
#else
import UIKit
#endif

extension TextJustification {
  var textAlignment: NSTextAlignment {
    switch self {
    case .left:
      return .left
    case .right:
      return .right
    case .center:
      return .center
    }
  }
  
  var caTextAlignement: CATextLayerAlignmentMode {
    switch self {
    case .left:
      return .left
    case .right:
      return .right
    case .center:
      return .center
    }
  }
}

final class TextCompositionLayer: CompositionLayer {
  
  let rootNode: TextAnimatorNode?
  let textDocument: KeyframeInterpolator<TextDocument>?
  
  let textLayer: TextLayer = TextLayer()
  var textProvider: AnimationTextProvider
  var fontProvider: AnimationFontProvider
  
  init(textLayer: TextLayerModel, textProvider: AnimationTextProvider, fontProvider: AnimationFontProvider) {
    var rootNode: TextAnimatorNode?
    for animator in textLayer.animators {
      rootNode = TextAnimatorNode(parentNode: rootNode, textAnimator: animator)
    }
    self.rootNode = rootNode
    self.textDocument = KeyframeInterpolator(keyframes: textLayer.text.keyframes)
    
    self.textProvider = textProvider
    self.fontProvider = fontProvider
    
    super.init(layer: textLayer, size: .zero)
    contentsLayer.addSublayer(self.textLayer)
    self.textLayer.masksToBounds = false
  }
  
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override init(layer: Any) {
    /// Used for creating shadow model layers. Read More here: https://developer.apple.com/documentation/quartzcore/calayer/1410842-init
    guard let layer = layer as? TextCompositionLayer else {
      fatalError("init(layer:) Wrong Layer Class")
    }
    self.rootNode = nil
    self.textDocument = nil
    
    self.textProvider = DefaultTextProvider()
    self.fontProvider = DefaultFontProvider()
    
    super.init(layer: layer)
  }
  
  override func displayContentsWithFrame(frame: CGFloat, forceUpdates: Bool) {
    guard let textDocument = textDocument else { return }
    
    textLayer.contentsScale = self.renderScale
    
    let documentUpdate = textDocument.hasUpdate(frame: frame)
    let animatorUpdate = rootNode?.updateContents(frame, forceLocalUpdate: forceUpdates) ?? false
    guard documentUpdate == true || animatorUpdate == true else { return }
    
    rootNode?.rebuildOutputs(frame: frame)
    
    // Get Text Attributes
    let text = textDocument.value(frame: frame) as! TextDocument
    let strokeColor = rootNode?.textOutputNode.strokeColor ?? text.strokeColorData?.cgColorValue
    let strokeWidth = rootNode?.textOutputNode.strokeWidth ?? CGFloat(text.strokeWidth ?? 0)
    let tracking = (CGFloat(text.fontSize) * (rootNode?.textOutputNode.tracking ?? CGFloat(text.tracking))) / 1000.0
    let matrix = rootNode?.textOutputNode.xform ?? CATransform3DIdentity
    let textString = textProvider.textFor(keypathName: self.keypathName, sourceText: text.text)
    let ctFont = fontProvider.fontFor(family: text.fontFamily, size: CGFloat(text.fontSize))

    // Set all of the text layer options
    textLayer.text = textString
    textLayer.font = ctFont
    textLayer.alignment = text.justification.textAlignment
    textLayer.lineHeight = CGFloat(text.lineHeight)
    textLayer.tracking = tracking
    
    if let fillColor = rootNode?.textOutputNode.fillColor {
      textLayer.fillColor = fillColor
    } else if let fillColor = text.fillColorData?.cgColorValue {
      textLayer.fillColor = fillColor
    } else {
      textLayer.fillColor = nil
    }
    
    textLayer.preferredSize = text.textFrameSize?.sizeValue
    textLayer.strokeOnTop = text.strokeOverFill ?? false
    textLayer.strokeWidth = strokeWidth
    textLayer.strokeColor = strokeColor
    textLayer.sizeToFit()
    
    textLayer.opacity = Float(rootNode?.textOutputNode.opacity ?? 1)
    textLayer.transform = CATransform3DIdentity
    textLayer.position = text.textFramePosition?.pointValue ?? CGPoint.zero
    textLayer.transform = matrix
  }
  
  override func updateRenderScale() {
    super.updateRenderScale()
    textLayer.contentsScale = self.renderScale
  }
}

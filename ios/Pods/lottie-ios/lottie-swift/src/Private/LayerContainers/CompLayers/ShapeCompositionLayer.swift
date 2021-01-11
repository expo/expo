//
//  ShapeLayerContainer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/22/19.
//

import Foundation
import CoreGraphics

/**
 A CompositionLayer responsible for initializing and rendering shapes
 */
final class ShapeCompositionLayer: CompositionLayer {
  
  let rootNode: AnimatorNode?
  let renderContainer: ShapeContainerLayer?
  
  init(shapeLayer: ShapeLayerModel) {
    let results = shapeLayer.items.initializeNodeTree()
    let renderContainer = ShapeContainerLayer()
    self.renderContainer = renderContainer
    self.rootNode = results.rootNode
    super.init(layer: shapeLayer, size: .zero)
    contentsLayer.addSublayer(renderContainer)
    for container in results.renderContainers {
      renderContainer.insertRenderLayer(container)
    }
    rootNode?.updateTree(0, forceUpdates: true)
    self.childKeypaths.append(contentsOf: results.childrenNodes)
  }
  
  override init(layer: Any) {
    guard let layer = layer as? ShapeCompositionLayer else {
      fatalError("init(layer:) wrong class.")
    }
    self.rootNode = nil
    self.renderContainer = nil
    super.init(layer: layer)
  }
  
  override func displayContentsWithFrame(frame: CGFloat, forceUpdates: Bool) {
    rootNode?.updateTree(frame, forceUpdates: forceUpdates)
    renderContainer?.markRenderUpdates(forFrame: frame)
  }
  
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override func updateRenderScale() {
    super.updateRenderScale()
    renderContainer?.renderScale = renderScale
  }
  
}

//
//  PassThroughOutputNode.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/30/19.
//

import Foundation
import CoreGraphics

class PassThroughOutputNode: NodeOutput {
  
  init(parent: NodeOutput?) {
    self.parent = parent
  }
  
  let parent: NodeOutput?
  
  var hasUpdate: Bool = false
  var isEnabled: Bool = true
  
  func hasOutputUpdates(_ forFrame: CGFloat) -> Bool {
    /// Changes to this node do not affect downstream nodes.
    let parentUpdate = parent?.hasOutputUpdates(forFrame) ?? false
    /// Changes to upstream nodes do, however, affect this nodes state.
    hasUpdate = hasUpdate || parentUpdate
    return parentUpdate
  }
  
  var outputPath: CGPath? {
    if let parent = parent {
      return parent.outputPath
    }
    return nil
  }
  
  func hasRenderUpdates(_ forFrame: CGFloat) -> Bool {
    /// Return true if there are upstream updates or if this node has updates
    let upstreamUpdates = parent?.hasOutputUpdates(forFrame) ?? false
    hasUpdate = hasUpdate || upstreamUpdates
    return hasUpdate
  }
}

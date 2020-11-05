//
//  PathNodeOutput.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/30/19.
//

import Foundation
import CoreGraphics

/// A node that has an output of a BezierPath
class PathOutputNode: NodeOutput {
  
  init(parent: NodeOutput?) {
    self.parent = parent
  }
  
  let parent: NodeOutput?
  
  fileprivate(set) var outputPath: CGPath? = nil
  
  var lastUpdateFrame: CGFloat? = nil
  var lastPathBuildFrame: CGFloat? = nil
  var isEnabled: Bool = true
  
  func hasOutputUpdates(_ forFrame: CGFloat) -> Bool {
    guard isEnabled else {
      let upstreamUpdates = parent?.hasOutputUpdates(forFrame) ?? false
      outputPath = parent?.outputPath
      return upstreamUpdates
    }
    
    /// Ask if parent was updated
    let upstreamUpdates = parent?.hasOutputUpdates(forFrame) ?? false
    
    /// If parent was updated and the path hasn't been built for this frame, clear the path.
    if upstreamUpdates && lastPathBuildFrame != forFrame {
      outputPath = nil
    }

    if outputPath == nil {
      /// If the path is clear, build the new path.
      lastPathBuildFrame = forFrame
      let newPath = CGMutablePath()
      if let parentNode = parent, let parentPath = parentNode.outputPath {
        newPath.addPath(parentPath)
      }
      for path in pathObjects {
        for subPath in path.paths {
          newPath.addPath(subPath.cgPath())
        }
      }
      outputPath = newPath
    }
    
    /// Return true if there were upstream updates or if this node was updated.
    return upstreamUpdates || (lastUpdateFrame == forFrame)
  }
  
  // MARK: Internal
  
  fileprivate(set) var totalLength: CGFloat = 0
  fileprivate(set) var pathObjects: [CompoundBezierPath] = []
  
  @discardableResult func removePaths(updateFrame: CGFloat?) -> [CompoundBezierPath] {
    lastUpdateFrame = updateFrame
    let returnPaths = pathObjects
    outputPath = nil
    totalLength = 0
    pathObjects = []
    return returnPaths
  }
  
  func setPath(_ path: BezierPath, updateFrame: CGFloat) {
    lastUpdateFrame = updateFrame
    outputPath = nil
    totalLength = path.length
    pathObjects = [CompoundBezierPath(path: path)]
  }
  
  func appendPath(_ path: CompoundBezierPath, updateFrame: CGFloat) {
    lastUpdateFrame = updateFrame
    outputPath = nil
    totalLength = totalLength + path.length
    pathObjects.append(path)
  }
  
}

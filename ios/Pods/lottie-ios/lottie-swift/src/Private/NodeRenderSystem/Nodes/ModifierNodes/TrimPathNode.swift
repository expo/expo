//
//  TrimPathNode.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/23/19.
//

import Foundation
import QuartzCore

final class TrimPathProperties: NodePropertyMap, KeypathSearchable {
  
  init(trim: Trim) {
    self.keypathName = trim.name
    self.start = NodeProperty(provider: KeyframeInterpolator(keyframes: trim.start.keyframes))
    self.end = NodeProperty(provider: KeyframeInterpolator(keyframes: trim.end.keyframes))
    self.offset = NodeProperty(provider: KeyframeInterpolator(keyframes: trim.offset.keyframes))
    self.type = trim.trimType
    self.keypathProperties = [
      "Start" : start,
      "End" : end,
      "Offset" : offset
    ]
    self.properties = Array(keypathProperties.values)
  }
  
  let keypathProperties: [String : AnyNodeProperty]
  let properties: [AnyNodeProperty]
  let keypathName: String
  
  let start: NodeProperty<Vector1D>
  let end: NodeProperty<Vector1D>
  let offset: NodeProperty<Vector1D>
  let type: TrimType
}

final class TrimPathNode: AnimatorNode {
  
  let properties: TrimPathProperties
  
  fileprivate let upstreamPaths: [PathOutputNode]
  
  init(parentNode: AnimatorNode?, trim: Trim, upstreamPaths: [PathOutputNode]) {
    self.outputNode = PassThroughOutputNode(parent: parentNode?.outputNode)
    self.parentNode = parentNode
    self.properties = TrimPathProperties(trim: trim)
    self.upstreamPaths = upstreamPaths
  }
  
  // MARK: Animator Node
  var propertyMap: NodePropertyMap & KeypathSearchable {
    return properties
  }
  
  let parentNode: AnimatorNode?
  let outputNode: NodeOutput
  var hasLocalUpdates: Bool = false
  var hasUpstreamUpdates: Bool = false
  var lastUpdateFrame: CGFloat? = nil
  var isEnabled: Bool = true
  
  func forceUpstreamOutputUpdates() -> Bool {
    return hasLocalUpdates || hasUpstreamUpdates
  }
  
  func rebuildOutputs(frame: CGFloat) {
    /// Make sure there is a trim.
    let startValue = properties.start.value.cgFloatValue  * 0.01
    let endValue = properties.end.value.cgFloatValue * 0.01
    let start = min(startValue, endValue)
    let end = max(startValue, endValue)
    
    let offset = properties.offset.value.cgFloatValue.truncatingRemainder(dividingBy: 360) / 360
    
    /// No need to trim, it's a full path
    if start == 0, end == 1 {
      return
    }
    
    /// All paths are empty.
    if start == end {
      for pathContainer in upstreamPaths {
        pathContainer.removePaths(updateFrame: frame)
      }
      return
    }
    
    if properties.type == .simultaneously {
      /// Just trim each path
      for pathContainer in upstreamPaths {
        let pathObjects = pathContainer.removePaths(updateFrame: frame)
        for path in pathObjects {
          // We are treating each compount path as an individual path. Its subpaths are treated as a whole.
          pathContainer.appendPath(path.trim(fromPosition: start, toPosition: end, offset: offset, trimSimultaneously: false), updateFrame: frame)
        }
      }
      return
    }
    
    /// Individual path trimming.
    
    /// Brace yourself for the below code.
    
    /// Normalize lengths with offset.
    var startPosition = (start+offset).truncatingRemainder(dividingBy: 1)
    var endPosition =  (end+offset).truncatingRemainder(dividingBy: 1)
    
    if startPosition < 0 {
      startPosition = 1 + startPosition
    }
    
    if endPosition < 0 {
      endPosition = 1 + endPosition
    }
    if startPosition == 1 {
      startPosition = 0
    }
    if endPosition == 0 {
      endPosition = 1
    }
    
    
    /// First get the total length of all paths.
    var totalLength: CGFloat = 0
    upstreamPaths.forEach({ totalLength = totalLength + $0.totalLength })
    
    /// Now determine the start and end cut lengths
    let startLength = startPosition * totalLength
    let endLength = endPosition * totalLength
    var pathStart: CGFloat = 0
    
    /// Now loop through all path containers
    for pathContainer in upstreamPaths {
      
      let pathEnd = pathStart + pathContainer.totalLength
      
      if !startLength.isInRange(pathStart, pathEnd) &&
        endLength.isInRange(pathStart, pathEnd) {
        // pathStart|=======E----------------------|pathEnd
        // Cut path components, removing after end.
        
        let pathCutLength = endLength - pathStart
        let subpaths = pathContainer.removePaths(updateFrame: frame)
        var subpathStart: CGFloat = 0
        for path in subpaths {
          let subpathEnd = subpathStart + path.length
          if pathCutLength < subpathEnd {
            /// This is the subpath that needs to be cut.
            let cutLength = pathCutLength - subpathStart
            let newPath = path.trim(fromPosition: 0, toPosition: cutLength / path.length, offset: 0, trimSimultaneously: false)
            pathContainer.appendPath(newPath, updateFrame: frame)
            break
          } else {
            /// Add to container and move on
            pathContainer.appendPath(path, updateFrame: frame)
          }
          if pathCutLength == subpathEnd {
            /// Right on the end. The next subpath is not included. Break.
            break
          }
          subpathStart = subpathEnd
        }
        
      } else if !endLength.isInRange(pathStart, pathEnd) &&
        startLength.isInRange(pathStart, pathEnd) {
        // pathStart|-------S======================|pathEnd
        //
        
        // Cut path components, removing before beginning.
        let pathCutLength = startLength - pathStart
        // Clear paths from container
        let subpaths = pathContainer.removePaths(updateFrame: frame)
        var subpathStart: CGFloat = 0
        for path in subpaths {
          let subpathEnd = subpathStart + path.length
          
          if subpathStart < pathCutLength, pathCutLength < subpathEnd {
            /// This is the subpath that needs to be cut.
            let cutLength = pathCutLength - subpathStart
            let newPath = path.trim(fromPosition: cutLength / path.length, toPosition: 1, offset: 0, trimSimultaneously: false)
            pathContainer.appendPath(newPath, updateFrame: frame)
          } else if pathCutLength <= subpathStart {
            pathContainer.appendPath(path, updateFrame: frame)
          }
          subpathStart = subpathEnd
        }
      } else if endLength.isInRange(pathStart, pathEnd) &&
        startLength.isInRange(pathStart, pathEnd) {
        // pathStart|-------S============E---------|endLength
        // pathStart|=====E----------------S=======|endLength
        // trim from path beginning to endLength.
        
        // Cut path components, removing before beginnings.
        let startCutLength = startLength - pathStart
        let endCutLength = endLength - pathStart
        // Clear paths from container
        let subpaths = pathContainer.removePaths(updateFrame: frame)
        var subpathStart: CGFloat = 0
        for path in subpaths {
          
          let subpathEnd = subpathStart + path.length
          
          if !startCutLength.isInRange(subpathStart, subpathEnd) &&
            !endCutLength.isInRange(subpathStart, subpathEnd) {
            // The whole path is included. Add
            // S|==============================|E
            pathContainer.appendPath(path, updateFrame: frame)
            
          } else if startCutLength.isInRange(subpathStart, subpathEnd) &&
            !endCutLength.isInRange(subpathStart, subpathEnd) {
            /// The start of the path needs to be trimmed
            //  |-------S======================|E
            let cutLength = startCutLength - subpathStart
            let newPath = path.trim(fromPosition: cutLength / path.length, toPosition: 1, offset: 0, trimSimultaneously: false)
            pathContainer.appendPath(newPath, updateFrame: frame)
          } else if !startCutLength.isInRange(subpathStart, subpathEnd) &&
            endCutLength.isInRange(subpathStart, subpathEnd) {
            // S|=======E----------------------|
            let cutLength = endCutLength - subpathStart
            let newPath = path.trim(fromPosition: 0, toPosition: cutLength / path.length, offset: 0, trimSimultaneously: false)
            pathContainer.appendPath(newPath, updateFrame: frame)
            break
          } else if startCutLength.isInRange(subpathStart, subpathEnd) &&
            endCutLength.isInRange(subpathStart, subpathEnd) {
            //  |-------S============E---------|
            let cutFromLength = startCutLength - subpathStart
            let cutToLength = endCutLength - subpathStart
            let newPath = path.trim(fromPosition: cutFromLength / path.length, toPosition: cutToLength / path.length, offset: 0, trimSimultaneously: false)
            pathContainer.appendPath(newPath, updateFrame: frame)
            break
          }
          
          subpathStart = subpathEnd
        }
      } else if (endLength <= pathStart && pathEnd <= startLength) ||
        (startLength <= pathStart && endLength <= pathStart) ||
        (pathEnd <= startLength && pathEnd <= endLength) {
        /// The Path needs to be cleared
        pathContainer.removePaths(updateFrame: frame)
      }
      
      pathStart = pathEnd
    }
    
  }
  
}

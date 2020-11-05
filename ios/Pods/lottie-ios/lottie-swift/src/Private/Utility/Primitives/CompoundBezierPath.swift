//
//  CompoundBezierPath.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/14/19.
//

import Foundation
import CoreGraphics

/**
 A collection of BezierPath objects that can be trimmed and added.
 
 */
struct CompoundBezierPath {
  
  let paths: [BezierPath]
  
  let length: CGFloat
  
  init() {
    paths = []
    length = 0
  }
  
  init(path: BezierPath) {
    self.paths = [path]
    self.length = path.length
  }
  
  init(paths: [BezierPath], length: CGFloat) {
    self.paths = paths
    self.length = length
  }
  
  init(paths: [BezierPath]) {
    self.paths = paths
    var l: CGFloat = 0
    for path in paths {
      l = l + path.length
    }
    self.length = l
  }
  
  func addPath(path: BezierPath) -> CompoundBezierPath {
    var newPaths = paths
    newPaths.append(path)
    return CompoundBezierPath(paths: newPaths, length: length + path.length)
  }
  
  func combine(_ compoundBezier: CompoundBezierPath) -> CompoundBezierPath {
    var newPaths = paths
    newPaths.append(contentsOf: compoundBezier.paths)
    return CompoundBezierPath(paths: newPaths, length: length + compoundBezier.length)
  }
  
  func trim(fromPosition: CGFloat, toPosition: CGFloat, offset: CGFloat, trimSimultaneously: Bool) -> CompoundBezierPath {
    if fromPosition == toPosition {
      return CompoundBezierPath()
    }
    
    if trimSimultaneously {
      /// Trim each path individually.
      var newPaths = [BezierPath]()
      for path in paths {
        newPaths.append(contentsOf: path.trim(fromLength: fromPosition * path.length,
                                              toLength: toPosition * path.length,
                                              offsetLength: offset * path.length))
      }
      return CompoundBezierPath(paths: newPaths)
    }
    
    /// Normalize lengths to the curve length.
    var startPosition = (fromPosition+offset).truncatingRemainder(dividingBy: 1)
    var endPosition =  (toPosition+offset).truncatingRemainder(dividingBy: 1)
    
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
    
    if startPosition == 0 && endPosition == 1 ||
      startPosition == endPosition ||
      startPosition == 1 && endPosition == 0 {
      /// The trim encompasses the entire path. Return.
      return self
    }
    
    var positions: [(start: CGFloat, end: CGFloat)]
    if endPosition < startPosition {
      positions = [(start: 0, end: endPosition * length),
                   (start: startPosition * length, end: length)]
    } else {
      positions = [(start: startPosition * length, end: endPosition * length)]
    }
    
    var compoundPath = CompoundBezierPath()
    var trim = positions.remove(at: 0)
    var pathStartPosition: CGFloat = 0
    
    var finishedTrimming: Bool = false
    var i: Int = 0
    
    while !finishedTrimming {
      if paths.count <= i {
        /// Rounding errors
        finishedTrimming = true
        continue
      }
      let path = paths[i]
      
      let pathEndPosition = pathStartPosition + path.length
      
      if pathEndPosition < trim.start {
        /// Path is not included in the trim, continue.
        pathStartPosition = pathEndPosition
        i = i + 1
        continue
        
      } else if trim.start <= pathStartPosition, pathEndPosition <= trim.end {
        /// Full Path is inside of trim. Add full path.
        compoundPath = compoundPath.addPath(path: path)
      } else {
        if let trimPath = path.trim(fromLength: trim.start > pathStartPosition ? (trim.start - pathStartPosition) : 0,
                                 toLength: trim.end < pathEndPosition ? (trim.end - pathStartPosition) : path.length,
                                 offsetLength: 0).first {
            compoundPath = compoundPath.addPath(path: trimPath)
        }
      }

      
      if trim.end <= pathEndPosition {
        /// We are done with the current trim.
        /// Advance trim but remain on the same path in case the next trim overlaps it.
        if positions.count > 0 {
          trim = positions.remove(at: 0)
        } else {
          finishedTrimming = true
        }
      } else {
        pathStartPosition = pathEndPosition
        i = i + 1
      }
    }
    return compoundPath
  }
  
}

//
//  KeyframeInterpolator.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/15/19.
//

import Foundation
import CoreGraphics

/// A value provider that produces a value at Time from a group of keyframes
final class KeyframeInterpolator<ValueType>: AnyValueProvider where ValueType: Interpolatable {
  
  init(keyframes: ContiguousArray<Keyframe<ValueType>>) {
    self.keyframes = keyframes
  }
  let keyframes: ContiguousArray<Keyframe<ValueType>>
  
  var valueType: Any.Type {
    return ValueType.self
  }
  
  /**
   Returns true to trigger a frame update for this interpolator.
   
   An interpolator will be asked if it needs to update every frame.
   If the interpolator needs updating it will be asked to compute its value for
   the given frame.
   
   Cases a keyframe should not be updated:
   - If time is in span and leading keyframe is hold
   - If time is after the last keyframe.
   - If time is before the first keyframe
   
   Cases for updating a keyframe:
   - If time is in the span, and is not a hold
   - If time is outside of the span, and there are more keyframes
   - If a value delegate is set
   - If leading and trailing are both nil.
   */
  func hasUpdate(frame: CGFloat) -> Bool {
    if lastUpdatedFrame == nil {
      return true
    }

    if let leading = leadingKeyframe,
      trailingKeyframe == nil,
      leading.time < frame {
      /// Frame is after bounds of keyframes
      return false
    }
    if let trailing = trailingKeyframe,
      leadingKeyframe == nil,
      frame < trailing.time {
      /// Frame is before bounds of keyframes
      return false
    }
    if let leading = leadingKeyframe,
      let trailing = trailingKeyframe,
      leading.isHold,
      leading.time < frame,
      frame < trailing.time {
      return false
    }
    return true
  }
  
  fileprivate var lastUpdatedFrame: CGFloat?
  
  @discardableResult
  func value(frame: CGFloat) -> Any {
    // First set the keyframe span for the frame.
    updateSpanIndices(frame: frame)
    lastUpdatedFrame = frame
    // If only one keyframe return its value
    let progress: CGFloat
    let value: ValueType
    
    if let leading = leadingKeyframe,
      let trailing = trailingKeyframe {
      /// We have leading and trailing keyframe.
      progress = leading.interpolatedProgress(trailing, keyTime: frame)
      value = leading.interpolate(trailing, progress: progress)
    } else if let leading = leadingKeyframe {
      progress = 0
      value = leading.value
    } else if let trailing = trailingKeyframe {
      progress = 1
      value = trailing.value
    } else {
      /// Satisfy the compiler.
      progress = 0
      value = keyframes[0].value
    }
    return value
  }
  
  fileprivate var leadingIndex: Int? = nil
  fileprivate var trailingIndex: Int? = nil
  fileprivate var leadingKeyframe: Keyframe<ValueType>? = nil
  fileprivate var trailingKeyframe: Keyframe<ValueType>? = nil
  
  /// Finds the appropriate Leading and Trailing keyframe index for the given time.
  fileprivate func updateSpanIndices(frame: CGFloat) {
    guard keyframes.count > 0 else {
      leadingIndex = nil
      trailingIndex = nil
      leadingKeyframe = nil
      trailingKeyframe = nil
      return
    }
    
    /**
     This function searches through the array to find the span of two keyframes
     that contain the current time.
     
     We could use Array.first(where:) but that would search through the entire array
     each frame.
     Instead we track the last used index and search either forwards or
     backwards from there. This reduces the iterations and complexity from
     
     O(n), where n is the length of the sequence to
     O(n), where n is the number of items after or before the last used index.
     
     */
    
    if keyframes.count == 1 {
      /// Only one keyframe. Set it as first and move on.
      leadingIndex = 0
      trailingIndex = nil
      leadingKeyframe = keyframes[0]
      trailingKeyframe = nil
      return
    }
    
    /// Sets the initial keyframes. This is often only needed for the first check.
    if leadingIndex == nil &&
      trailingIndex == nil {
      if frame < keyframes[0].time {
        /// Time is before the first keyframe. Set it as the trailing.
        trailingIndex = 0
      } else {
        /// Time is after the first keyframe. Set the keyframe and the trailing.
        leadingIndex = 0
        trailingIndex = 1
      }
    }
    
    if let currentTrailing = trailingIndex,
      keyframes[currentTrailing].time <= frame {
      /// Time is after the current span. Iterate forward.
      var newLeading = currentTrailing
      var keyframeFound: Bool = false
      while !keyframeFound {
        
        leadingIndex = newLeading
        trailingIndex = keyframes.validIndex(newLeading + 1)
        
        guard let trailing = trailingIndex else {
            /// We have reached the end of our keyframes. Time is after the last keyframe.
            keyframeFound = true
            continue
        }
        if frame < keyframes[trailing].time {
          /// Keyframe in current span.
          keyframeFound = true
          continue
        }
        /// Advance the array.
        newLeading = trailing
      }
      
    } else if let currentLeading = leadingIndex,
      frame < keyframes[currentLeading].time {
      
      /// Time is before the current span. Iterate backwards
      var newTrailing = currentLeading
      
      var keyframeFound: Bool = false
      while !keyframeFound {
        
        leadingIndex = keyframes.validIndex(newTrailing - 1)
        trailingIndex = newTrailing
        
        guard let leading = leadingIndex else {
            /// We have reached the end of our keyframes. Time is after the last keyframe.
            keyframeFound = true
            continue
        }
        if keyframes[leading].time <= frame {
          /// Keyframe in current span.
          keyframeFound = true
          continue
        }
        /// Step back
        newTrailing = leading
      }
    }
    if let keyFrame = leadingIndex {
      leadingKeyframe = keyframes[keyFrame]
    } else {
      leadingKeyframe = nil
    }
    
    if let keyFrame = trailingIndex {
      trailingKeyframe = keyframes[keyFrame]
    } else {
      trailingKeyframe = nil
    }
  }
}

fileprivate extension Array {
  
  func validIndex(_ index: Int) -> Int? {
    if 0 <= index, index < endIndex {
      return index
    }
    return nil
  }
  
}

fileprivate extension ContiguousArray {
  
  func validIndex(_ index: Int) -> Int? {
    if 0 <= index, index < endIndex {
      return index
    }
    return nil
  }
  
}

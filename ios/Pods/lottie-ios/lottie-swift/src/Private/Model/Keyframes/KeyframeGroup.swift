//
//  KeyframeGroup.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/14/19.
//

import Foundation

/**
 Used for coding/decoding a group of Keyframes by type.
 
 Keyframe data is wrapped in a dictionary { "k" : KeyframeData }.
 The keyframe data can either be an array of keyframes or, if no animation is present, the raw value.
 This helper object is needed to properly decode the json.
 */

final class KeyframeGroup<T>: Codable where T: Codable, T: Interpolatable {
  
  let keyframes: ContiguousArray<Keyframe<T>>
  
  private enum KeyframeWrapperKey: String, CodingKey {
    case keyframeData = "k"
  }
  
  init(keyframes: ContiguousArray<Keyframe<T>>) {
    self.keyframes = keyframes
  }
  
  init(_ value: T) {
    self.keyframes = [Keyframe(value)]
  }

  required init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: KeyframeWrapperKey.self)
    
    if let keyframeData: T = try? container.decode(T.self, forKey: .keyframeData) {
      /// Try to decode raw value; No keyframe data.
      self.keyframes = [Keyframe<T>(keyframeData)]
    } else {
      /**
       Decode and array of keyframes.
       
       Body Movin and Lottie deal with keyframes in different ways.
       
       A keyframe object in Body movin defines a span of time with a START
       and an END, from the current keyframe time to the next keyframe time.
       
       A keyframe object in Lottie defines a singular point in time/space.
       This point has an in-tangent and an out-tangent.
       
       To properly decode this we must iterate through keyframes while holding
       reference to the previous keyframe.
       */
      
      var keyframesContainer = try container.nestedUnkeyedContainer(forKey: .keyframeData)
      var keyframes = ContiguousArray<Keyframe<T>>()
      var previousKeyframeData: KeyframeData<T>?
      while(!keyframesContainer.isAtEnd) {
        // Ensure that Time and Value are present.
        
        let keyframeData = try keyframesContainer.decode(KeyframeData<T>.self)
        
        guard let value: T = keyframeData.startValue ?? previousKeyframeData?.endValue,
          let time = keyframeData.time else {
            /// Missing keyframe data. JSON must be corrupt.
            throw DecodingError.dataCorruptedError(forKey: KeyframeWrapperKey.keyframeData, in: container, debugDescription: "Missing keyframe data.")
        }
        
        keyframes.append(Keyframe<T>(value: value,
                                    time: time,
                                    isHold: keyframeData.isHold,
                                    inTangent: previousKeyframeData?.inTangent,
                                    outTangent: keyframeData.outTangent,
                                    spatialInTangent: previousKeyframeData?.spatialInTangent,
                                    spatialOutTangent: keyframeData.spatialOutTangent))
        previousKeyframeData = keyframeData
      }
      self.keyframes = keyframes
    }
  }
  
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: KeyframeWrapperKey.self)
    
    if keyframes.count == 1 {
      let keyframe = keyframes[0]
      try container.encode(keyframe.value, forKey: .keyframeData)
    } else {
      var keyframeContainer = container.nestedUnkeyedContainer(forKey: .keyframeData)
      
      for i in 1..<keyframes.endIndex {
        let keyframe = keyframes[i-1]
        let nextKeyframe = keyframes[i]
        let keyframeData = KeyframeData<T>(startValue: keyframe.value,
                                                  endValue: nextKeyframe.value,
                                                  time: Double(keyframe.time),
                                                  hold: keyframe.isHold ? 1 : nil,
                                                  inTangent: nextKeyframe.inTangent,
                                                  outTangent: keyframe.outTangent,
                                                  spatialInTangent: nil,
                                                  spatialOutTangent: nil)
        try keyframeContainer.encode(keyframeData)
      }
    }
  }
  
}

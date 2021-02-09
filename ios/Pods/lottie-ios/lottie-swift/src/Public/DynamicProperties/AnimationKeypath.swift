//
//  AnimationKeypath.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/4/19.
//

import Foundation

/**
 `AnimationKeypath` is an object that describes a keypath search for nodes in the
 animation JSON. `AnimationKeypath` matches views and properties inside of `AnimationView`
 to their backing `Animation` model by name.
 
 A keypath can be used to set properties on an existing animation, or can be validated
 with an existing `Animation`.
 
 `AnimationKeypath` can describe a specific object, or can use wildcards for fuzzy matching
 of objects. Acceptable wildcards are either "*" (star) or "**" (double star).
 Single star will search a single depth for the next object.
 Double star will search any depth.
 
 Read More at https://airbnb.io/lottie/#/ios?id=dynamic-animation-properties
 
 EG:
 @"Layer.Shape Group.Stroke 1.Color"
 Represents a specific color node on a specific stroke.
 
 @"**.Stroke 1.Color"
 Represents the color node for every Stroke named "Stroke 1" in the animation.
 */
public struct AnimationKeypath {
  
  /// Creates a keypath from a dot separated string. The string is separated by "."
  public init(keypath: String) {
    self.keys = keypath.components(separatedBy: ".")
  }
  
  /// Creates a keypath from a list of strings.
  public init(keys: [String]) {
    self.keys = keys
  }
  
  let keys: [String]
  
}

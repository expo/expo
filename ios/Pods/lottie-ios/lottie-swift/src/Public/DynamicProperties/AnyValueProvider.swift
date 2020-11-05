//
//  AnyValueProvider.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/30/19.
//

import Foundation
import CoreGraphics

/**
 `AnyValueProvider` is a protocol that return animation data for a property at a
 given time. Every fame an `AnimationView` queries all of its properties and asks
 if their ValueProvider has an update. If it does the AnimationView will read the
 property and update that portion of the animation.
 
 Value Providers can be used to dynamically set animation properties at run time.
 */
public protocol AnyValueProvider {
  
  /// The Type of the value provider
  var valueType: Any.Type { get }
  
  /// Asks the provider if it has an update for the given frame.
  func hasUpdate(frame: AnimationFrameTime) -> Bool
  
  /// Asks the provider to update the container with its value for the frame.
  func value(frame: AnimationFrameTime) -> Any
}

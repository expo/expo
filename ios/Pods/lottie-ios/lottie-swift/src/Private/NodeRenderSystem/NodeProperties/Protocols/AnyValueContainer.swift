//
//  AnyValueContainer.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/30/19.
//

import Foundation
import CoreGraphics

/// The container for the value of a property.
protocol AnyValueContainer: class {
  
  /// The stored value of the container
  var value: Any { get }
  
  /// Notifies the provider that it should update its container
  func setNeedsUpdate()
  
  /// When true the container needs to have its value updated by its provider
  var needsUpdate: Bool { get }
  
  /// The frame time of the last provided update
  var lastUpdateFrame: CGFloat { get }
  
}

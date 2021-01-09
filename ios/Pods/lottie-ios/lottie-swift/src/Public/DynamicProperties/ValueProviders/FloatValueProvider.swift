//
//  DoubleValueProvider.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/4/19.
//

import Foundation
import CoreGraphics

/// A `ValueProvider` that returns a CGFloat Value
public final class FloatValueProvider: AnyValueProvider {
  
  /// Returns a CGFloat for a CGFloat(Frame Time)
  public typealias CGFloatValueBlock = (CGFloat) -> CGFloat
  
  public var float: CGFloat {
    didSet {
      hasUpdate = true
    }
  }
  
  /// Initializes with a block provider
  public init(block: @escaping CGFloatValueBlock) {
    self.block = block
    self.float = 0
  }
  
  /// Initializes with a single float.
  public init(_ float: CGFloat) {
    self.float = float
    self.block = nil
    hasUpdate = true
  }
  
  // MARK: ValueProvider Protocol
  
  public var valueType: Any.Type {
    return Vector1D.self
  }
  
  public func hasUpdate(frame: CGFloat) -> Bool {
    if block != nil {
      return true
    }
    return hasUpdate
  }
  
  public func value(frame: CGFloat) -> Any {
    hasUpdate = false
    let newCGFloat: CGFloat
    if let block = block {
      newCGFloat = block(frame)
    } else {
      newCGFloat = float
    }
    return Vector1D(Double(newCGFloat))
  }
  
  // MARK: Private
  
  private var hasUpdate: Bool = true
  
  private var block: CGFloatValueBlock?
}


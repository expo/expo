//
//  SizeValueProvider.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/4/19.
//

import Foundation
import CoreGraphics

/// A `ValueProvider` that returns a CGSize Value
public final class SizeValueProvider: AnyValueProvider {
  
  /// Returns a CGSize for a CGFloat(Frame Time)
  public typealias SizeValueBlock = (CGFloat) -> CGSize
  
  public var size: CGSize {
    didSet {
      hasUpdate = true
    }
  }
  
  /// Initializes with a block provider
  public init(block: @escaping SizeValueBlock) {
    self.block = block
    self.size = .zero
  }
  
  /// Initializes with a single size.
  public init(_ size: CGSize) {
    self.size = size
    self.block = nil
    hasUpdate = true
  }
  
  // MARK: ValueProvider Protocol
  
  public var valueType: Any.Type {
    return Vector3D.self
  }
  
  public func hasUpdate(frame: CGFloat) -> Bool {
    if block != nil {
      return true
    }
    return hasUpdate
  }
  
  public func value(frame: CGFloat) -> Any {
    hasUpdate = false
    let newSize: CGSize
    if let block = block {
      newSize = block(frame)
    } else {
      newSize = size
    }
    return newSize.vector3dValue
  }
  
  // MARK: Private
  
  private var hasUpdate: Bool = true
  
  private var block: SizeValueBlock?
}

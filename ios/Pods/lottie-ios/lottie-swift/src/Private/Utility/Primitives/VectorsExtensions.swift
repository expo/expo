//
//  Vector.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/7/19.
//

import Foundation
import CoreGraphics
import QuartzCore

/**
 Single value container. Needed because lottie sometimes wraps a Double in an array.
 */
extension Vector1D: Codable {

  public init(from decoder: Decoder) throws {
    /// Try to decode an array of doubles
    do {
      var container = try decoder.unkeyedContainer()
      self.value = try container.decode(Double.self)
    } catch {
      self.value = try decoder.singleValueContainer().decode(Double.self)
    }
  }
  
  public func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(value)
  }
  
  var cgFloatValue: CGFloat {
    return CGFloat(value)
  }
  
}

extension Double {
  var vectorValue: Vector1D {
    return Vector1D(self)
  }
}

/**
 Needed for decoding json {x: y:} to a CGPoint
 */
struct Vector2D: Codable {
  
  var x: Double
  var y: Double
  
  init(x: Double, y: Double) {
    self.x = x
    self.y = y
  }
  
  private enum CodingKeys : String, CodingKey {
    case x = "x"
    case y = "y"
  }
  
  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: Vector2D.CodingKeys.self)
    
    do {
      let xValue: [Double] = try container.decode([Double].self, forKey: .x)
      self.x = xValue[0]
    } catch {
      self.x = try container.decode(Double.self, forKey: .x)
    }
    
    do {
      let yValue: [Double] = try container.decode([Double].self, forKey: .y)
      self.y = yValue[0]
    } catch {
      self.y = try container.decode(Double.self, forKey: .y)
    }
  }
  
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: Vector2D.CodingKeys.self)
    try container.encode(x, forKey: .x)
    try container.encode(y, forKey: .y)
  }
  
  var pointValue: CGPoint {
    return CGPoint(x: x, y: y)
  }
}

extension Vector2D {
  
}

extension CGPoint {
  var vector2dValue: Vector2D {
    return Vector2D(x: Double(x), y: Double(y))
  }
}

/**
 A three dimensional vector.
 These vectors are encoded and decoded from [Double]
 */

extension Vector3D: Codable {

  init(x: CGFloat, y: CGFloat, z: CGFloat) {
    self.x = Double(x)
    self.y = Double(y)
    self.z = Double(z)
  }
  
  public init(from decoder: Decoder) throws {
    var container = try decoder.unkeyedContainer()
    
    if !container.isAtEnd {
      self.x = try container.decode(Double.self)
    } else {
      self.x = 0
    }
    
    if !container.isAtEnd {
      self.y = try container.decode(Double.self)
    } else {
      self.y = 0
    }
    
    if !container.isAtEnd {
      self.z = try container.decode(Double.self)
    } else {
      self.z = 0
    }
  }
  
  public func encode(to encoder: Encoder) throws {
    var container = encoder.unkeyedContainer()
    try container.encode(x)
    try container.encode(y)
    try container.encode(z)
  }
  
}

public extension Vector3D {
  var pointValue: CGPoint {
    return CGPoint(x: x, y: y)
  }
  
  var sizeValue: CGSize {
    return CGSize(width: x, height: y)
  }
}

extension CGPoint {
  var vector3dValue: Vector3D {
    return Vector3D(x: x, y: y, z: 0)
  }
}

extension CGSize {
  var vector3dValue: Vector3D {
    return Vector3D(x: width, y: height, z: 1)
  }
}

extension CATransform3D {
  
  func rotated(_ degrees: CGFloat) -> CATransform3D {
    return CATransform3DRotate(self, degrees.toRadians(), 0, 0, 1)
  }
  
  func translated(_ translation: CGPoint) -> CATransform3D {
    return CATransform3DTranslate(self, translation.x, translation.y, 0)
  }
  
  func scaled(_ scale: CGSize) -> CATransform3D {
    return CATransform3DScale(self, scale.width, scale.height, 1)
  }
  
  func skewed(skew: CGFloat, skewAxis: CGFloat) -> CATransform3D {
    return CATransform3DConcat(CATransform3D.makeSkew(skew: skew, skewAxis: skewAxis), self)
  }
  
  static func makeSkew(skew: CGFloat, skewAxis: CGFloat) -> CATransform3D {
    let mCos = cos(skewAxis.toRadians())
    let mSin = sin(skewAxis.toRadians())
    let aTan = tan(skew.toRadians())
    
    let transform1 = CATransform3D(m11: mCos, m12: mSin, m13: 0, m14: 0,
                                   m21: -mSin, m22: mCos, m23: 0, m24: 0,
                                   m31: 0, m32: 0, m33: 1, m34: 0,
                                   m41: 0, m42: 0, m43: 0, m44: 1)
    
    let transform2 = CATransform3D(m11: 1, m12: 0, m13: 0, m14: 0,
                                   m21: aTan, m22: 1, m23: 0, m24: 0,
                                   m31: 0, m32: 0, m33: 1, m34: 0,
                                   m41: 0, m42: 0, m43: 0, m44: 1)
    
    let transform3 = CATransform3D(m11: mCos, m12: -mSin, m13: 0, m14: 0,
                                   m21: mSin, m22: mCos, m23: 0, m24: 0,
                                   m31: 0, m32: 0, m33: 1, m34: 0,
                                   m41: 0, m42: 0, m43: 0, m44: 1)
    return CATransform3DConcat(transform3, CATransform3DConcat(transform2, transform1))
  }
  
  static func makeTransform(anchor: CGPoint,
                            position: CGPoint,
                            scale: CGSize,
                            rotation: CGFloat,
                            skew: CGFloat?,
                            skewAxis: CGFloat?) -> CATransform3D {
    if let skew = skew, let skewAxis = skewAxis {
      return CATransform3DMakeTranslation(position.x, position.y, 0).rotated(rotation).skewed(skew: -skew, skewAxis: skewAxis).scaled(scale * 0.01).translated(anchor * -1)
    }
    return CATransform3DMakeTranslation(position.x, position.y, 0).rotated(rotation).scaled(scale * 0.01).translated(anchor * -1)
  }
}

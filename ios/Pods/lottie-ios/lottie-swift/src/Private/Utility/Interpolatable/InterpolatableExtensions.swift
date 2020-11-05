//
//  InterpolatableExtensions.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/14/19.
//

import Foundation
import CoreGraphics

extension Vector1D: Interpolatable {
  func interpolateTo(_ to: Vector1D, amount: CGFloat, spatialOutTangent: CGPoint?, spatialInTangent: CGPoint?) -> Vector1D {
    return value.interpolateTo(to.value, amount: amount).vectorValue
  }
}

extension Vector2D: Interpolatable {
  func interpolateTo(_ to: Vector2D, amount: CGFloat, spatialOutTangent: CGPoint?, spatialInTangent: CGPoint?) -> Vector2D {
    return pointValue.interpolateTo(to.pointValue, amount: CGFloat(amount), spatialOutTangent: spatialOutTangent, spatialInTangent: spatialInTangent).vector2dValue
  }
  
}

extension Vector3D: Interpolatable {
  func interpolateTo(_ to: Vector3D, amount: CGFloat, spatialOutTangent: CGPoint?, spatialInTangent: CGPoint?) -> Vector3D {
    if spatialInTangent != nil || spatialOutTangent != nil {
      // TODO Support third dimension spatial interpolation
      let point = pointValue.interpolateTo(to.pointValue, amount: amount, spatialOutTangent: spatialOutTangent, spatialInTangent: spatialInTangent)
      return Vector3D(x: point.x,
                      y: point.y,
                      z: CGFloat(z.interpolateTo(to.z, amount: amount)))
    }
    return Vector3D(x: x.interpolateTo(to.x, amount: amount),
                    y: y.interpolateTo(to.y, amount: amount),
                    z: z.interpolateTo(to.z, amount: amount))
  }
}

extension Color: Interpolatable {
  
  /// Initialize a new color with Hue Saturation and Value
  init(h: Double, s: Double, v: Double, a: Double) {
    
    let i = floor(h * 6)
    let f = h * 6 - i
    let p = v * (1 - s);
    let q = v * (1 - f * s)
    let t = v * (1 - (1 - f) * s)
    
    switch (i.truncatingRemainder(dividingBy: 6)) {
    case 0:
      self.r = v
      self.g = t
      self.b = p
    case 1:
      self.r = q
      self.g = v
      self.b = p
    case 2:
      self.r = p
      self.g = v
      self.b = t
    case 3:
      self.r = p
      self.g = q
      self.b = v
    case 4:
      self.r = t
      self.g = p
      self.b = v
    case 5:
      self.r = v
      self.g = p
      self.b = q
    default:
      self.r = 0
      self.g = 0
      self.b = 0
    }
    self.a = a
  }
  
  /// Hue Saturation Value of the color.
  var hsva: (h: Double, s: Double, v: Double, a: Double) {
    let maxValue = max(r, g, b)
    let minValue = min(r, g, b)
    
    var h: Double, s: Double, v: Double = maxValue
    
    let d = maxValue - minValue
    s = maxValue == 0 ? 0 : d / maxValue;
    
    if (maxValue == minValue) {
      h = 0; // achromatic
    } else {
      switch (maxValue) {
      case r: h = (g - b) / d + (g < b ? 6 : 0)
      case g: h = (b - r) / d + 2
      case b: h = (r - g) / d + 4
      default: h = maxValue
      }
      h = h / 6
    }
    return (h: h, s: s, v: v, a: a)
  }
  
  init(y: Double, u: Double, v: Double, a: Double) {
    // From https://www.fourcc.org/fccyvrgb.php
    self.r = y + 1.403 * v
    self.g = y - 0.344 * u
    self.b = y + 1.770 * u
    self.a = a
  }
  
  var yuv: (y: Double, u: Double, v: Double, a: Double) {
    /// From https://www.fourcc.org/fccyvrgb.php
    let y = 0.299 * r + 0.587 * g + 0.114 * b
    let u = -0.14713 * r - 0.28886 * g + 0.436 * b
    let v = 0.615 * r - 0.51499 * g - 0.10001 * b
    return (y: y, u: u, v: v, a: a)
  }
  
  func interpolateTo(_ to: Color, amount: CGFloat, spatialOutTangent: CGPoint?, spatialInTangent: CGPoint?) -> Color {
    return Color(r: r.interpolateTo(to.r, amount: amount),
                 g: g.interpolateTo(to.g, amount: amount),
                 b: b.interpolateTo(to.b, amount: amount),
                 a: a.interpolateTo(to.a, amount: amount))
  }
}

extension CurveVertex: Interpolatable {
  func interpolateTo(_ to: CurveVertex, amount: CGFloat, spatialOutTangent: CGPoint?, spatialInTangent: CGPoint?) -> CurveVertex {
    return CurveVertex(point: point.interpolate(to.point, amount: amount),
                       inTangent: inTangent.interpolate(to.inTangent, amount: amount),
                       outTangent: outTangent.interpolate(to.outTangent, amount: amount))
  }
}

extension BezierPath: Interpolatable {
  func interpolateTo(_ to: BezierPath, amount: CGFloat, spatialOutTangent: CGPoint?, spatialInTangent: CGPoint?) -> BezierPath {
    var newPath = BezierPath()
    for i in 0..<min(elements.count, to.elements.count) {
      let fromVertex = elements[i].vertex
      let toVertex = to.elements[i].vertex
      newPath.addVertex(fromVertex.interpolateTo(toVertex, amount: amount, spatialOutTangent: spatialOutTangent, spatialInTangent: spatialInTangent))
    }
    return newPath
  }
}

extension TextDocument: Interpolatable {
  
  func interpolateTo(_ to: TextDocument, amount: CGFloat, spatialOutTangent: CGPoint?, spatialInTangent: CGPoint?) -> TextDocument {
    if amount == 1 {
      return to
    }
    return self
  }
}

extension Array: Interpolatable where Element == Double {
  func interpolateTo(_ to: Array<Element>, amount: CGFloat, spatialOutTangent: CGPoint?, spatialInTangent: CGPoint?) -> Array<Element> {
    var returnArray = [Double]()
    for i in 0..<self.count {
      returnArray.append(self[i].interpolateTo(to[i], amount: amount))
    }
    return returnArray
  }
  
}

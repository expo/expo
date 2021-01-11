//
//  Color.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/14/19.
//

import Foundation
import CoreGraphics

extension Color: Codable {

  public init(from decoder: Decoder) throws {
    var container = try decoder.unkeyedContainer()
    
    var r1: Double
    if !container.isAtEnd {
      r1 = try container.decode(Double.self)
    } else {
      r1 = 0
    }
    
    var g1: Double
    if !container.isAtEnd {
      g1 = try container.decode(Double.self)
    } else {
      g1 = 0
    }
    
    var b1: Double
    if !container.isAtEnd {
      b1 = try container.decode(Double.self)
    } else {
      b1 = 0
    }
    
    var a1: Double
    if !container.isAtEnd {
      a1 = try container.decode(Double.self)
    } else {
      a1 = 1
    }
    if r1 > 1, g1 > 1, b1 > 1, a1 > 1 {
      r1 = r1 / 255
      g1 = g1 / 255
      b1 = b1 / 255
      a1 = a1 / 255
    }
    self.r = r1
    self.g = g1
    self.b = b1
    self.a = a1
  }
  
  public func encode(to encoder: Encoder) throws {
    var container = encoder.unkeyedContainer()
    try container.encode(r)
    try container.encode(g)
    try container.encode(b)
    try container.encode(a)
  }
  
}

extension Color {
  
  static var clearColor: CGColor {
    return CGColor(colorSpace: CGColorSpaceCreateDeviceRGB(), components: [0, 0, 0, 0])!
  }
  
  var cgColorValue: CGColor {
    // TODO: Fix color spaces
    let colorspace = CGColorSpaceCreateDeviceRGB()
    return CGColor(colorSpace: colorspace, components: [CGFloat(r), CGFloat(g), CGFloat(b), CGFloat(a)]) ?? Color.clearColor
  }
}

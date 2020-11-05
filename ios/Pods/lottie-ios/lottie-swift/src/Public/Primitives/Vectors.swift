//
//  Vectors.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/4/19.
//

import Foundation

public struct Vector1D {
  
  public init(_ value: Double) {
    self.value = value
  }
  
  let value: Double
  
}


/**
 A three dimensional vector.
 These vectors are encoded and decoded from [Double]
 */
public struct Vector3D {
  
  var x: Double
  var y: Double
  var z: Double
  
  public init(x: Double, y: Double, z: Double) {
    self.x = x
    self.y = y
    self.z = z
  }
  
}

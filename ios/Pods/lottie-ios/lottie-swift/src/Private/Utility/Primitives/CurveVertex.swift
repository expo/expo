//
//  CurveVertex.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/11/19.
//

import Foundation
import CoreGraphics

/// A single vertex with an in and out tangent
struct CurveVertex {
  
  let point: CGPoint
  
  let inTangent: CGPoint
  let outTangent: CGPoint
  
  /// Initializes a curve point with absolute values
  init(_ inTangent: CGPoint, _ point: CGPoint, _ outTangent: CGPoint) {
    self.point = point
    self.inTangent = inTangent
    self.outTangent = outTangent
  }
  
  /// Initializes a curve point with relative values
  init(point: CGPoint, inTangentRelative: CGPoint, outTangentRelative: CGPoint) {
    self.point = point
    self.inTangent = point.add(inTangentRelative)
    self.outTangent = point.add(outTangentRelative)
  }
  
  /// Initializes a curve point with absolute values
  init(point: CGPoint, inTangent: CGPoint, outTangent: CGPoint) {
    self.point = point
    self.inTangent = inTangent
    self.outTangent = outTangent
  }
  
  var inTangentRelative: CGPoint {
    return inTangent.subtract(point)
  }
  
  var outTangentRelative: CGPoint {
    return outTangent.subtract(point)
  }
  
  func reversed() -> CurveVertex {
    return CurveVertex(point: point, inTangent: outTangent, outTangent: inTangent)
  }
  
  func translated(_ translation: CGPoint) -> CurveVertex {
    return CurveVertex(point: point + translation, inTangent: inTangent + translation, outTangent: outTangent + translation)
  }
  
  /**
   Trims a path defined by two Vertices at a specific position, from 0 to 1
   
   The path can be visualized below.
   
   F is fromVertex.
   V is the vertex of the receiver.
   P is the position from 0-1.
   O is the outTangent of fromVertex.
   F====O=========P=======I====V
   
   After trimming the curve can be visualized below.
   
   S is the returned Start vertex.
   E is the returned End vertex.
   T is the trim point.
   TI and TO are the new tangents for the trimPoint
   NO and NI are the new tangents for the startPoint and endPoints
   S==NO=========TI==T==TO=======NI==E
   */
  func splitCurve(toVertex: CurveVertex, position: CGFloat) ->
    (start: CurveVertex, trimPoint: CurveVertex, end: CurveVertex) {
      
      /// If position is less than or equal to 0, trim at start.
      if position <= 0 {
        return (start: CurveVertex(point: point, inTangentRelative: inTangentRelative, outTangentRelative: .zero),
                trimPoint: CurveVertex(point: point, inTangentRelative: .zero, outTangentRelative: outTangentRelative),
                end: toVertex)
      }
      
      /// If position is greater than or equal to 1, trim at end.
      if position >= 1 {
        return (start: self,
                trimPoint: CurveVertex(point: toVertex.point, inTangentRelative: toVertex.inTangentRelative, outTangentRelative: .zero),
                end: CurveVertex(point: toVertex.point, inTangentRelative: .zero, outTangentRelative: toVertex.outTangentRelative))
      }
      
      if outTangentRelative.isZero && toVertex.inTangentRelative.isZero {
        /// If both tangents are zero, then span to be trimmed is a straight line.
        let trimPoint = point.interpolate(toVertex.point, amount: position)
        return (start: self,
                trimPoint: CurveVertex(point: trimPoint, inTangentRelative: .zero, outTangentRelative: .zero),
                end: toVertex)
      }
      /// Cutting by amount gives incorrect length....
      /// One option is to cut by a stride until it gets close then edge it down.
      /// Measuring a percentage of the spans does not equal the same as measuring a percentage of length.
      /// This is where the historical trim path bugs come from.
      let a = point.interpolate(outTangent, amount: position)
      let b = outTangent.interpolate(toVertex.inTangent, amount: position)
      let c = toVertex.inTangent.interpolate(toVertex.point, amount: position)
      let d = a.interpolate(b, amount: position)
      let e = b.interpolate(c, amount: position)
      let f = d.interpolate(e, amount: position)
      return (start: CurveVertex(point: point, inTangent: inTangent, outTangent: a),
              trimPoint: CurveVertex(point: f, inTangent: d, outTangent: e),
              end: CurveVertex(point: toVertex.point, inTangent: c, outTangent: toVertex.outTangent))
  }
  
  /**
   Trims a curve of a known length to a specific length and returns the points.
   
   There is not a performant yet accurate way to cut a curve to a specific length.
   This calls splitCurve(toVertex: position:) to split the curve and then measures
   the length of the new curve. The function then iterates through the samples,
   adjusting the position of the cut for a more precise cut.
   Usually a single iteration is enough to get within 0.5 points of the desired
   length.
   
   This function should probably live in PathElement, since it deals with curve
   lengths.
  */
  func trimCurve(toVertex: CurveVertex, atLength: CGFloat, curveLength: CGFloat, maxSamples: Int, accuracy: CGFloat = 1) ->
    (start: CurveVertex, trimPoint: CurveVertex, end: CurveVertex) {
      var currentPosition = atLength / curveLength
      var results = splitCurve(toVertex: toVertex, position: currentPosition)
      
      if maxSamples == 0 {
        return results
      }
      
      for _ in 1...maxSamples {
        let length = results.start.distanceTo(results.trimPoint)
        let lengthDiff = atLength - length
        /// Check if length is correct.
        if lengthDiff < accuracy {
          return results
        }
        let diffPosition = max(min(((currentPosition / length) * lengthDiff), currentPosition * 0.5), currentPosition * -0.5)
        currentPosition = diffPosition + currentPosition
        results = splitCurve(toVertex: toVertex, position: currentPosition)
      }
      return results
  }

  
  /**
   The distance from the receiver to the provided vertex.
   
   For lines (zeroed tangents) the distance between the two points is measured.
   For curves the curve is iterated over by sample count and the points are measured.
   This is ~99% accurate at a sample count of 30
   */
  func distanceTo(_ toVertex: CurveVertex, sampleCount: Int = 25) -> CGFloat {
    
    if outTangentRelative.isZero && toVertex.inTangentRelative.isZero {
      /// Return a linear distance.
      return point.distanceTo(toVertex.point)
    }
    
    var distance: CGFloat = 0
    
    var previousPoint = point
    for i in 0..<sampleCount {
      let pointOnCurve = splitCurve(toVertex: toVertex, position: CGFloat(i) / CGFloat(sampleCount)).trimPoint
      distance = distance + previousPoint.distanceTo(pointOnCurve.point)
      previousPoint = pointOnCurve.point
    }
    distance = distance + previousPoint.distanceTo(toVertex.point)
    return distance
  }
}

//
//  Shape.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/8/19.
//

import Foundation
import CoreGraphics

/// A container that holds instructions for creating a single, unbroken Bezier Path.
struct BezierPath {
  
  /// The elements of the path
  fileprivate(set) var elements: [PathElement]
  
  /// If the path is closed or not.
  fileprivate(set) var closed: Bool
  
  /// The total length of the path.
  fileprivate(set) var length: CGFloat
  
  /// Initializes a new Bezier Path.
  init(startPoint: CurveVertex) {
    self.elements = [PathElement(vertex: startPoint)]
    self.length = 0
    self.closed = false
  }
  
  init() {
    self.elements = []
    self.length = 0
    self.closed = false
  }
  
  mutating func moveToStartPoint(_ vertex: CurveVertex) {
    self.elements = [PathElement(vertex: vertex)]
    self.length = 0
  }
  
  mutating func addVertex(_ vertex: CurveVertex) {
    guard let previous = elements.last else {
      addElement(PathElement(vertex: vertex))
      return
    }
    addElement(previous.pathElementTo(vertex))
  }
  
  mutating func addCurve(toPoint: CGPoint, outTangent: CGPoint, inTangent: CGPoint) {
    guard let previous = elements.last else { return }
    let newVertex = CurveVertex(inTangent, toPoint, toPoint)
    updateVertex(CurveVertex(previous.vertex.inTangent, previous.vertex.point, outTangent), atIndex: elements.endIndex - 1, remeasure: false)
    addVertex(newVertex)
  }
  
  mutating func addLine(toPoint: CGPoint) {
    guard let previous = elements.last else { return }
    let newVertex = CurveVertex(point: toPoint, inTangentRelative: .zero, outTangentRelative: .zero)
    updateVertex(CurveVertex(previous.vertex.inTangent, previous.vertex.point, previous.vertex.point), atIndex: elements.endIndex - 1, remeasure: false)
    addVertex(newVertex)
  }
  
  mutating func close() {
    self.closed = true
  }
  
  mutating func addElement(_ pathElement: PathElement) {
    elements.append(pathElement)
    length = length + pathElement.length
  }
  
  mutating func updateVertex(_ vertex: CurveVertex, atIndex: Int, remeasure: Bool) {
    if remeasure {
      var newElement: PathElement
      if atIndex > 0 {
        let previousElement = elements[atIndex-1]
        newElement = previousElement.pathElementTo(vertex)
      } else {
        newElement = PathElement(vertex: vertex)
      }
      elements[atIndex] = newElement
      
      if atIndex + 1 < elements.count{
        let nextElement = elements[atIndex + 1]
        elements[atIndex + 1] = newElement.pathElementTo(nextElement.vertex)
      }
      
    } else {
      let oldElement = elements[atIndex]
      elements[atIndex] = oldElement.updateVertex(newVertex: vertex)
    }
  }
  
  /**
   Trims a path fromLength toLength with an offset.
   
   Length and offset are defined in the length coordinate space.
   If any argument is outside the range of this path, then it will be looped over the path from finish to start.
   
   Cutting the curve when fromLength is less than toLength
   x                    x                                 x                          x
   ~~~~~~~~~~~~~~~ooooooooooooooooooooooooooooooooooooooooooooooooo-------------------
   |Offset        |fromLength                             toLength|                  |
   
   Cutting the curve when from Length is greater than toLength
   x                x                    x               x                           x
   oooooooooooooooooo--------------------~~~~~~~~~~~~~~~~ooooooooooooooooooooooooooooo
   |        toLength|                    |Offset         |fromLength                 |
   
   */
  func trim(fromLength: CGFloat, toLength: CGFloat, offsetLength: CGFloat) -> [BezierPath] {
    guard elements.count > 1 else {
      return []
    }
    
    if fromLength == toLength {
      return []
    }
    
    /// Normalize lengths to the curve length.
    var start = (fromLength+offsetLength).truncatingRemainder(dividingBy: length)
    var end =  (toLength+offsetLength).truncatingRemainder(dividingBy: length)
    
    if start < 0 {
      start = length + start
    }
    
    if end < 0 {
      end = length + end
    }
    
    if start == length {
      start = 0
    }
    if end == 0 {
      end = length
    }
    
    if start == 0 && end == length ||
      start == end ||
      start == length && end == 0 {
      /// The trim encompasses the entire path. Return.
      return [self]
    }
    
    if start > end {
      // Start is greater than end. Two paths are returned.
      return trimPathAtLengths(positions: [(start: 0, end: end), (start: start, end: length)])
    }
    
    return trimPathAtLengths(positions: [(start: start, end: end)])
  }
  
  // MARK: File Private
  
  /// Trims a path by a list of positions and returns the sub paths
  fileprivate func trimPathAtLengths(positions: [(start: CGFloat, end: CGFloat)]) -> [BezierPath] {
    guard positions.count > 0 else {
      return []
    }
    var remainingPositions = positions
    
    var trim = remainingPositions.remove(at: 0)

    var paths = [BezierPath]()
    
    var runningLength: CGFloat = 0
    var finishedTrimming: Bool = false
    var pathElements = elements
    
    var currentPath = BezierPath()
    var i: Int = 0
    
    while !finishedTrimming {
      if pathElements.count <= i {
        /// Do this for rounding errors
        paths.append(currentPath)
        finishedTrimming = true
        continue
      }
      /// Loop through and add elements within start->end range.
      /// Get current element
      let element = pathElements[i]
      
      /// Calculate new running length.
      let newLength = runningLength + element.length
      
      if newLength < trim.start {
        /// Element is not included in the trim, continue.
        runningLength = newLength
        i = i + 1
        /// Increment index, we are done with this element.
        continue
      }
      
      if newLength == trim.start {
        /// Current element IS the start element.
        /// For start we want to add a zero length element.
        currentPath.moveToStartPoint(element.vertex)
        runningLength = newLength
        i = i + 1
        /// Increment index, we are done with this element.
        continue
      }
      
      if runningLength < trim.start, trim.start < newLength, currentPath.elements.count == 0 {
        /// The start of the trim is between this element and the previous, trim.
        /// Get previous element.
        let previousElement = pathElements[i-1]
        /// Trim it
        let trimLength = trim.start - runningLength
        let trimResults = element.splitElementAtPosition(fromElement: previousElement, atLength: trimLength)
        /// Add the right span start.
        currentPath.moveToStartPoint(trimResults.rightSpan.start.vertex)

        pathElements[i] = trimResults.rightSpan.end
        pathElements[i-1] = trimResults.rightSpan.start
        runningLength = runningLength + trimResults.leftSpan.end.length
        /// Dont increment index or the current length, the end of this path can be within this span.
        continue
      }
      
      if trim.start < newLength, newLength < trim.end {
        /// Element lies within the trim span.
        currentPath.addElement(element)
        runningLength = newLength
        i = i + 1
        continue
      }
      
      if newLength == trim.end {
        /// Element is the end element.
        /// The element could have a new length if it's added right after the start node.
        currentPath.addElement(element)
        /// We are done with this span.
        runningLength = newLength
        i = i + 1
        /// Allow the path to be finalized.
        /// Fall through to finalize path and move to next position
      }
      
      if runningLength < trim.end, trim.end < newLength {
        /// New element must be cut for end.
        /// Get previous element.
        let previousElement = pathElements[i-1]
        /// Trim it
        let trimLength = trim.end - runningLength
        let trimResults = element.splitElementAtPosition(fromElement: previousElement, atLength: trimLength)
        /// Add the left span end.
        
        currentPath.updateVertex(trimResults.leftSpan.start.vertex, atIndex: currentPath.elements.count - 1, remeasure: false)
        currentPath.addElement(trimResults.leftSpan.end)
        
        pathElements[i] = trimResults.rightSpan.end
        pathElements[i-1] = trimResults.rightSpan.start
        runningLength = runningLength + trimResults.leftSpan.end.length
        /// Dont increment index or the current length, the start of the next path can be within this span.
        /// We are done with this span.
        /// Allow the path to be finalized.
        /// Fall through to finalize path and move to next position
      }
      
      paths.append(currentPath)
      currentPath = BezierPath()
      if remainingPositions.count > 0 {
        trim = remainingPositions.remove(at: 0)
      } else {
        finishedTrimming = true
      }
    }
    return paths
  }
  
}

extension BezierPath: Codable {
  
  /**
   The BezierPath container is encoded and decoded from the JSON format
   that defines points for a lottie animation.
   
   {
   "c" = Bool
   "i" = [[Double]],
   "o" = [[Double]],
   "v" = [[Double]]
   }
   
   */
  
  enum CodingKeys : String, CodingKey {
    case closed = "c"
    case inPoints = "i"
    case outPoints = "o"
    case vertices = "v"
  }
  
  init(from decoder: Decoder) throws {
    let container: KeyedDecodingContainer<BezierPath.CodingKeys>
    
    if let keyedContainer = try? decoder.container(keyedBy: BezierPath.CodingKeys.self) {
      container = keyedContainer
    } else {
      var unkeyedContainer = try decoder.unkeyedContainer()
      container = try unkeyedContainer.nestedContainer(keyedBy: BezierPath.CodingKeys.self)
    }
    
    self.closed = try container.decodeIfPresent(Bool.self, forKey: .closed) ?? true
    
    var vertexContainer = try container.nestedUnkeyedContainer(forKey: .vertices)
    var inPointsContainer = try container.nestedUnkeyedContainer(forKey: .inPoints)
    var outPointsContainer = try container.nestedUnkeyedContainer(forKey: .outPoints)
    
    guard vertexContainer.count == inPointsContainer.count, inPointsContainer.count == outPointsContainer.count else {
      /// Will throw an error if vertex, inpoints, and outpoints are not the same length.
      /// This error is to be expected.
      throw DecodingError.dataCorruptedError(forKey: CodingKeys.vertices,
                                             in: container,
                                             debugDescription: "Vertex data does not match In Tangents and Out Tangents")
    }
    
    guard let count = vertexContainer.count, count > 0 else {
      self.length = 0
      self.elements = []
      return
    }
    
    var decodedElements = [PathElement]()
    
    /// Create first point
    let firstVertex = CurveVertex(point: try vertexContainer.decode(CGPoint.self),
                                  inTangentRelative: try inPointsContainer.decode(CGPoint.self),
                                  outTangentRelative: try outPointsContainer.decode(CGPoint.self))
    var previousElement = PathElement(vertex: firstVertex)
    decodedElements.append(previousElement)
    
    var totalLength: CGFloat = 0
    while !vertexContainer.isAtEnd {
      /// Get the next vertex data.
      let vertex = CurveVertex(point: try vertexContainer.decode(CGPoint.self),
                               inTangentRelative: try inPointsContainer.decode(CGPoint.self),
                               outTangentRelative: try outPointsContainer.decode(CGPoint.self))
      let pathElement = previousElement.pathElementTo(vertex)
      decodedElements.append(pathElement)
      previousElement = pathElement
      totalLength = totalLength + pathElement.length
    }
    if closed {
      let closeElement = previousElement.pathElementTo(firstVertex)
      decodedElements.append(closeElement)
      totalLength = totalLength + closeElement.length
    }
    self.length = totalLength
    self.elements = decodedElements
  }
  
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: BezierPath.CodingKeys.self)
    try container.encode(closed, forKey: .closed)
    
    var vertexContainer = container.nestedUnkeyedContainer(forKey: .vertices)
    var inPointsContainer = container.nestedUnkeyedContainer(forKey: .inPoints)
    var outPointsContainer = container.nestedUnkeyedContainer(forKey: .outPoints)
    
    /// If closed path, ignore the final element.
    let finalIndex = closed ? self.elements.endIndex - 1 : self.elements.endIndex
    for i in 0..<finalIndex {
      let element = elements[i]
      try vertexContainer.encode(element.vertex.point)
      try inPointsContainer.encode(element.vertex.inTangentRelative)
      try outPointsContainer.encode(element.vertex.outTangentRelative)
    }
    
  }
}

extension BezierPath {
  
  func cgPath() -> CGPath {
    let cgPath = CGMutablePath()
    
    var previousElement: PathElement?
    for element in elements {
      if let previous = previousElement {
        if previous.vertex.outTangentRelative.isZero && element.vertex.inTangentRelative.isZero {
          cgPath.addLine(to: element.vertex.point)
        } else {
          cgPath.addCurve(to: element.vertex.point, control1: previous.vertex.outTangent, control2: element.vertex.inTangent)
        }
      } else {
        cgPath.move(to: element.vertex.point)
      }
      previousElement = element
    }
    if self.closed {
      cgPath.closeSubpath()
    }
    return cgPath
  }
  
}

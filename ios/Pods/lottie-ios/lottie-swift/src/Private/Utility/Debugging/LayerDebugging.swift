//
//  LayerDebugging.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/24/19.
//

import Foundation
import QuartzCore

struct LayerDebugStyle {
  let anchorColor: CGColor
  let boundsColor: CGColor
  let anchorWidth: CGFloat
  let boundsWidth: CGFloat
}

protocol LayerDebugging {
  var debugStyle: LayerDebugStyle { get }
}

protocol CustomLayerDebugging {
  func layerForDebugging() -> CALayer
}

class DebugLayer: CALayer {
  init(style: LayerDebugStyle) {
    super.init()
    zPosition = 1000
    bounds = CGRect(x: 0, y: 0, width: style.anchorWidth, height: style.anchorWidth)
    backgroundColor = style.anchorColor
  }
  
  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}

public extension CALayer {
  
  func logLayerTree(withIndent: Int = 0) {
    var string = ""
    for _ in 0...withIndent {
      string = string + "  "
    }
    string = string + "|_" + String(describing: self)
    print(string)
    if let sublayers = sublayers {
      for sublayer in sublayers {
        sublayer.logLayerTree(withIndent: withIndent + 1)
      }
    }
  }
  
}

extension CompositionLayer: CustomLayerDebugging {
  func layerForDebugging() -> CALayer {
    return contentsLayer
  }
}

extension CALayer {

  func setDebuggingState(visible: Bool) {
    
    var sublayers = self.sublayers
    if let cust = self as? CustomLayerDebugging {
      sublayers = cust.layerForDebugging().sublayers
    }
    
    if let sublayers = sublayers {
      for i in 0..<sublayers.count {
        if let debugLayer = sublayers[i] as? DebugLayer {
          debugLayer.removeFromSuperlayer()
          break
        }
      }
    }
    
    if let sublayers = sublayers {
      sublayers.forEach({ $0.setDebuggingState(visible: visible) })
    }
    
    if visible {
      let style: LayerDebugStyle
      if let layerDebugging = self as? LayerDebugging {
        style = layerDebugging.debugStyle
      } else {
        style = LayerDebugStyle.defaultStyle()
      }
      let debugLayer = DebugLayer(style: style)
      var container = self
      if let cust = self as? CustomLayerDebugging {
        container = cust.layerForDebugging()
      }
      container.addSublayer(debugLayer)
      debugLayer.position = .zero
      borderWidth = style.boundsWidth
      borderColor = style.boundsColor
    } else {
      borderWidth = 0
      borderColor = nil
    }
  }
}

extension AnimationContainer: LayerDebugging {
  var debugStyle: LayerDebugStyle {
    return LayerDebugStyle.topLayerStyle()
  }
}

extension NullCompositionLayer: LayerDebugging {
  var debugStyle: LayerDebugStyle {
    return LayerDebugStyle.nullLayerStyle()
  }
}

extension ShapeCompositionLayer: LayerDebugging {
  var debugStyle: LayerDebugStyle {
    return LayerDebugStyle.shapeLayerStyle()
  }
}

extension ShapeRenderLayer: LayerDebugging {
  var debugStyle: LayerDebugStyle {
    return LayerDebugStyle.shapeRenderLayerStyle()
  }
}

extension LayerDebugStyle {
  static func defaultStyle() -> LayerDebugStyle {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    
    let anchorColor = CGColor(colorSpace: colorSpace, components: [1, 0, 0, 1])!
    let boundsColor = CGColor(colorSpace: colorSpace, components: [1, 1, 0, 1])!
    return LayerDebugStyle(anchorColor: anchorColor,
                           boundsColor: boundsColor,
                           anchorWidth: 10,
                           boundsWidth: 2)
  }
  
  static func topLayerStyle() -> LayerDebugStyle {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let anchorColor = CGColor(colorSpace: colorSpace, components: [1, 0.5, 0, 0])!
    let boundsColor = CGColor(colorSpace: colorSpace, components: [0, 1, 0, 1])!
    
    return LayerDebugStyle(anchorColor: anchorColor,
                           boundsColor: boundsColor,
                           anchorWidth: 10,
                           boundsWidth: 2)
  }
  
  static func nullLayerStyle() -> LayerDebugStyle {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let anchorColor = CGColor(colorSpace: colorSpace, components: [0, 0, 1, 0])!
    let boundsColor = CGColor(colorSpace: colorSpace, components: [0, 1, 0, 1])!
    
    return LayerDebugStyle(anchorColor: anchorColor,
                           boundsColor: boundsColor,
                           anchorWidth: 10,
                           boundsWidth: 2)
  }
  
  static func shapeLayerStyle() -> LayerDebugStyle {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let anchorColor = CGColor(colorSpace: colorSpace, components: [0, 1, 0, 0])!
    let boundsColor = CGColor(colorSpace: colorSpace, components: [0, 1, 0, 1])!
    
    return LayerDebugStyle(anchorColor: anchorColor,
                           boundsColor: boundsColor,
                           anchorWidth: 10,
                           boundsWidth: 2)
  }
  
  static func shapeRenderLayerStyle() -> LayerDebugStyle {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let anchorColor = CGColor(colorSpace: colorSpace, components: [0, 1, 1, 0])!
    let boundsColor = CGColor(colorSpace: colorSpace, components: [0, 1, 0, 1])!
    
    return LayerDebugStyle(anchorColor: anchorColor,
                           boundsColor: boundsColor,
                           anchorWidth: 10,
                           boundsWidth: 2)
  }
}

extension Array where Element == LayerModel {
  
  var parents: [Int] {
    var array = [Int]()
    for layer in self {
      if let parent = layer.parent {
        array.append(parent)
      } else {
        array.append(-1)
      }
    }
    return array
  }
 
}

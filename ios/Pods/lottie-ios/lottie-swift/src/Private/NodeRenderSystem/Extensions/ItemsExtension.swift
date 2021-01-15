//
//  ItemsExtension.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/18/19.
//

import Foundation

final class NodeTree {
  var rootNode: AnimatorNode? = nil
  var transform: ShapeTransform? = nil
  var renderContainers: [ShapeContainerLayer] = []
  var paths: [PathOutputNode] = []
  var childrenNodes: [AnimatorNode] = []
}

extension Array where Element == ShapeItem {
  func initializeNodeTree() -> NodeTree {
    
    let nodeTree = NodeTree()

    for item in self {
      guard item.hidden == false, item.type != .unknown else { continue }
      if let fill = item as? Fill {
        let node = FillNode(parentNode: nodeTree.rootNode, fill: fill)
        nodeTree.rootNode = node
        nodeTree.childrenNodes.append(node)
      } else if let stroke = item as? Stroke {
        let node = StrokeNode(parentNode: nodeTree.rootNode, stroke: stroke)
        nodeTree.rootNode = node
        nodeTree.childrenNodes.append(node)
      } else if let gradientFill = item as? GradientFill {
        let node = GradientFillNode(parentNode: nodeTree.rootNode, gradientFill: gradientFill)
        nodeTree.rootNode = node
        nodeTree.childrenNodes.append(node)
      } else if let gradientStroke = item as? GradientStroke {
        let node = GradientStrokeNode(parentNode: nodeTree.rootNode, gradientStroke: gradientStroke)
        nodeTree.rootNode = node
        nodeTree.childrenNodes.append(node)
      } else if let ellipse = item as? Ellipse {
        let node = EllipseNode(parentNode: nodeTree.rootNode, ellipse: ellipse)
        nodeTree.rootNode = node
        nodeTree.childrenNodes.append(node)
      } else if let rect = item as? Rectangle {
        let node = RectangleNode(parentNode: nodeTree.rootNode, rectangle: rect)
        nodeTree.rootNode = node
        nodeTree.childrenNodes.append(node)
      } else if let star = item as? Star {
        switch star.starType {
        case .none:
          continue
        case .polygon:
          let node = PolygonNode(parentNode: nodeTree.rootNode, star: star)
          nodeTree.rootNode = node
          nodeTree.childrenNodes.append(node)
        case .star:
          let node = StarNode(parentNode: nodeTree.rootNode, star: star)
          nodeTree.rootNode = node
          nodeTree.childrenNodes.append(node)
        }
      } else if let shape = item as? Shape {
        let node = ShapeNode(parentNode: nodeTree.rootNode, shape: shape)
        nodeTree.rootNode = node
        nodeTree.childrenNodes.append(node)
      } else if let trim = item as? Trim {
        let node = TrimPathNode(parentNode: nodeTree.rootNode, trim: trim, upstreamPaths: nodeTree.paths)
        nodeTree.rootNode = node
        nodeTree.childrenNodes.append(node)
      } else if let xform = item as? ShapeTransform {
        nodeTree.transform = xform
        continue
      } else if let group = item as? Group {
        
        let tree = group.items.initializeNodeTree()
        let node = GroupNode(name: group.name, parentNode: nodeTree.rootNode, tree: tree)
        nodeTree.rootNode = node
        nodeTree.childrenNodes.append(node)
        /// Now add all child paths to current tree
        nodeTree.paths.append(contentsOf: tree.paths)
        nodeTree.renderContainers.append(node.container)
      }
      
      if let pathNode = nodeTree.rootNode as? PathNode {
        //// Add path container to the node tree
        nodeTree.paths.append(pathNode.pathOutput)
      }
      
      if let renderNode = nodeTree.rootNode as? RenderNode {
        nodeTree.renderContainers.append(ShapeRenderLayer(renderer: renderNode.renderer))
      }
    }
    return nodeTree
  }
}

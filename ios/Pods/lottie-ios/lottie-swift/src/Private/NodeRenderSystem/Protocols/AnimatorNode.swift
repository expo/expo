//
//  AnimatorNode.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 1/15/19.
//

import Foundation
import QuartzCore

/**
 Defines the basic outputs of an animator node.
 
 */
protocol NodeOutput {
  
  /// The parent node.
  var parent: NodeOutput? { get }
  
  /// Returns true if there are any updates upstream. OutputPath must be built before returning.
  func hasOutputUpdates(_ forFrame: CGFloat) -> Bool
  
  var outputPath: CGPath? { get }
  
  var isEnabled: Bool { get set }
}

/**
 The Animator Node is the base node in the render system tree.
 
 It defines a single node that has an output path and option input node.
 At animation time the root animation node is asked to update its contents for
 the current frame.
 The node reaches up its chain of nodes until the first node that does not need
 updating is found. Then each node updates its contents down the render pipeline.
 Each node adds its local path to its input path and passes it forward.
 
 An animator node holds a group of interpolators. These interpolators determine
 if the node needs an update for the current frame.
 
 */
protocol AnimatorNode: class, KeypathSearchable {
  
  /**
   The available properties of the Node.
   
   These properties are automatically updated each frame.
   These properties are also settable and gettable through the dynamic
   property system.
   
   */
  var propertyMap: NodePropertyMap & KeypathSearchable { get }
  
  /// The upstream input node
  var parentNode: AnimatorNode? { get }
  
  /// The output of the node.
  var outputNode: NodeOutput { get }
  
  /// Update the outputs of the node. Called if local contents were update or if outputsNeedUpdate returns true.
  func rebuildOutputs(frame: CGFloat)
  
  /// Setters for marking current node state.
  var isEnabled: Bool { get set }
  var hasLocalUpdates: Bool { get set }
  var hasUpstreamUpdates: Bool { get set }
  var lastUpdateFrame: CGFloat? { get set }
  
  // MARK: Optional
  
  /// Marks if updates to this node affect nodes downstream.
  func localUpdatesPermeateDownstream() -> Bool
  func forceUpstreamOutputUpdates() -> Bool
  
  /// Called at the end of this nodes update cycle. Always called. Optional.
  func performAdditionalLocalUpdates(frame: CGFloat, forceLocalUpdate: Bool) -> Bool
  func performAdditionalOutputUpdates(_ frame: CGFloat, forceOutputUpdate: Bool)
  
  /// The default simply returns `hasLocalUpdates`
  func shouldRebuildOutputs(frame: CGFloat) -> Bool
}

/// Basic Node Logic
extension AnimatorNode {
  
  func shouldRebuildOutputs(frame: CGFloat) -> Bool {
    return hasLocalUpdates
  }
  
  func localUpdatesPermeateDownstream() -> Bool {
    /// Optional override
    return true
  }
  
  func forceUpstreamOutputUpdates() -> Bool {
    /// Optional
    return false
  }
  
  func performAdditionalLocalUpdates(frame: CGFloat, forceLocalUpdate: Bool) -> Bool {
    /// Optional
    return forceLocalUpdate
  }
  
  func performAdditionalOutputUpdates(_ frame: CGFloat, forceOutputUpdate: Bool) {
    /// Optional
  }

  @discardableResult func updateOutputs(_ frame: CGFloat, forceOutputUpdate: Bool) -> Bool {
    guard isEnabled else {
      // Disabled node, pass through.
      lastUpdateFrame = frame
      return parentNode?.updateOutputs(frame, forceOutputUpdate: forceOutputUpdate) ?? false
    }
    
    if forceOutputUpdate == false && lastUpdateFrame != nil && lastUpdateFrame! == frame {
      /// This node has already updated for this frame. Go ahead and return the results.
      return hasUpstreamUpdates || hasLocalUpdates
    }

    /// Ask if this node should force output updates upstream.
    let forceUpstreamUpdates =  forceOutputUpdate || forceUpstreamOutputUpdates()
    
    /// Perform upstream output updates. Optionally mark upstream updates if any.
    hasUpstreamUpdates = (parentNode?.updateOutputs(frame, forceOutputUpdate: forceUpstreamUpdates) ?? false || hasUpstreamUpdates)
    
    /// Perform additional local output updates
    performAdditionalOutputUpdates(frame, forceOutputUpdate: forceUpstreamUpdates)
    
    /// If there are local updates, or if updates have been force, rebuild outputs
    if forceUpstreamUpdates || shouldRebuildOutputs(frame: frame) {
      lastUpdateFrame = frame
      rebuildOutputs(frame: frame)
    }
    return hasUpstreamUpdates || hasLocalUpdates
  }
  
  
  /// Rebuilds the content of this node, and upstream nodes if necessary.
  @discardableResult func updateContents(_ frame: CGFloat, forceLocalUpdate: Bool) -> Bool {
    guard isEnabled else {
      // Disabled node, pass through.
      return parentNode?.updateContents(frame, forceLocalUpdate: forceLocalUpdate) ?? false
    }
    
    if forceLocalUpdate == false && lastUpdateFrame != nil && lastUpdateFrame! == frame {
      /// This node has already updated for this frame. Go ahead and return the results.
      return localUpdatesPermeateDownstream() ? hasUpstreamUpdates || hasLocalUpdates : hasUpstreamUpdates
    }
    
    /// Are there local updates? If so mark the node.
    hasLocalUpdates = forceLocalUpdate ? forceLocalUpdate : propertyMap.needsLocalUpdate(frame: frame)
    
    /// Were there upstream updates? If so mark the node
    hasUpstreamUpdates = parentNode?.updateContents(frame, forceLocalUpdate: forceLocalUpdate) ?? false
    
    /// Perform property updates if necessary.
    if hasLocalUpdates {
      /// Rebuild local properties
      propertyMap.updateNodeProperties(frame: frame)
    }
    
    /// Ask the node to perform any other updates it might have.
    hasUpstreamUpdates = performAdditionalLocalUpdates(frame: frame, forceLocalUpdate: forceLocalUpdate) || hasUpstreamUpdates
    
    /// If the node can update nodes downstream, notify them, otherwise pass on any upstream updates downstream.
    return localUpdatesPermeateDownstream() ? hasUpstreamUpdates || hasLocalUpdates : hasUpstreamUpdates
  }
  
  func updateTree(_ frame: CGFloat, forceUpdates: Bool = false) {
    updateContents(frame, forceLocalUpdate: forceUpdates)
    updateOutputs(frame, forceOutputUpdate: forceUpdates)
  }
  
}

extension AnimatorNode {
  /// Default implementation for Keypath searchable.
  /// Forward all calls to the propertyMap.
  
  var keypathName: String {
    return propertyMap.keypathName
  }
  
  var keypathProperties: [String : AnyNodeProperty] {
    return propertyMap.keypathProperties
  }
  
  var childKeypaths: [KeypathSearchable] {
    return propertyMap.childKeypaths
  }
  
  var keypathLayer: CALayer? {
    return nil
  }
  
}

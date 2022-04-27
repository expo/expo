// Copyright 2021-present 650 Industries. All rights reserved.

import ABI45_0_0React

/**
 Custom component data extending `ABI45_0_0RCTComponentData`. Its main purpose is to handle event-based props (callbacks),
 but it also simplifies capturing the view config so we can omit some reflections that ABI45_0_0React Native executes.
 */
@objc(ABI45_0_0EXComponentData)
public final class ComponentData: ABI45_0_0RCTComponentData {
  /**
   Weak pointer to the holder of a module that the component data was created for.
   */
  weak var moduleHolder: ModuleHolder?

  /**
   Initializer that additionally takes the original view module to have access to its definition.
   */
  @objc
  public init(viewModule: ViewModuleWrapper, managerClass: ViewModuleWrapper.Type, bridge: ABI45_0_0RCTBridge) {
    self.moduleHolder = viewModule.wrappedModuleHolder
    super.init(managerClass: managerClass, bridge: bridge, eventDispatcher: bridge.eventDispatcher())
  }

  // MARK: ABI45_0_0RCTComponentData

  /**
   Creates a setter for the specific prop. For non-event props we just let ABI45_0_0React Native do its job.
   Events are handled differently to conveniently use them in Swift.
   */
  public override func createPropBlock(_ propName: String, isShadowView: Bool) -> ABI45_0_0RCTPropBlockAlias {
    // Expo Modules Core doesn't support shadow views yet, so fall back to the default implementation.
    if isShadowView {
      return super.createPropBlock(propName, isShadowView: isShadowView)
    }

    // If the prop is defined as an event, create our own event setter.
    if moduleHolder?.viewManager?.eventNames.contains(propName) == true {
      return createEventSetter(eventName: propName, bridge: self.manager?.bridge)
    }

    // Otherwise also fall back to the default implementation.
    return super.createPropBlock(propName, isShadowView: isShadowView)
  }

  /**
   The base `ABI45_0_0RCTComponentData` class does some Objective-C dynamic calls in this function, but we don't
   need to do these slow operations since the Sweet API gives us necessary details without reflections.
   */
  public override func viewConfig() -> [String: Any] {
    var propTypes: [String: Any] = [:]
    var directEvents: [String] = []
    let superClass: AnyClass? = managerClass.superclass()

    if let eventNames = moduleHolder?.viewManager?.eventNames {
      for eventName in eventNames {
        directEvents.append(ABI45_0_0RCTNormalizeInputEventName(eventName))
        propTypes[eventName] = "BOOL"
      }
    }

    return [
      "propTypes": propTypes,
      "directEvents": directEvents,
      "bubblingEvents": [String](),
      "baseModuleName": superClass?.moduleName() as Any
    ]
  }
}

/**
 Creates a setter for the event prop.
 */
private func createEventSetter(eventName: String, bridge: ABI45_0_0RCTBridge?) -> ABI45_0_0RCTPropBlockAlias {
  return { [weak bridge] (target: ABI45_0_0RCTComponent, value: Any) in
    // Find view's property that is named as the prop and is wrapped by `Event`.
    let child = Mirror(reflecting: target).children.first {
      $0.label == "_\(eventName)"
    }
    guard let event = child?.value as? AnyEventInternal else {
      return
    }

    // For callbacks ABI45_0_0React Native passes a bool value whether the prop is specified or not.
    if value as? Bool == true {
      event.settle { [weak target] (body: Any) in
        if let target = target {
          let componentEvent = ABI45_0_0RCTComponentEvent(name: eventName, viewTag: target.abi45_0_0ReactTag, body: ["payload": body])
          bridge?.eventDispatcher().send(componentEvent)
        }
      }
    } else {
      event.invalidate()
    }
  }
}

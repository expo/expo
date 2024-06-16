// Copyright 2021-present 650 Industries. All rights reserved.

import React

/**
 Custom component data extending `RCTComponentData`. Its main purpose is to handle event-based props (callbacks),
 but it also simplifies capturing the view config so we can omit some reflections that React Native executes.
 */
@objc(EXComponentData)
public final class ComponentData: RCTComponentDataSwiftAdapter {
  /**
   Weak pointer to the holder of a module that the component data was created for.
   */
  weak var moduleHolder: ModuleHolder?

  /**
   Initializer that additionally takes the original view module to have access to its definition.
   */
  @objc
  public init(viewModule: ViewModuleWrapper, managerClass: ViewModuleWrapper.Type, bridge: RCTBridge) {
    self.moduleHolder = viewModule.wrappedModuleHolder
    super.init(managerClass: managerClass, bridge: bridge, eventDispatcher: bridge.eventDispatcher())
  }

  // MARK: RCTComponentData

  /**
   Creates a setter for the specific prop. For non-event props we just let React Native do its job.
   Events are handled differently to conveniently use them in Swift.
   */
  public override func createPropBlock(_ propName: String, isShadowView: Bool) -> RCTPropBlockAlias {
    // Expo Modules Core doesn't support shadow views yet, so fall back to the default implementation.
    if isShadowView {
      return super.createPropBlock(propName, isShadowView: isShadowView)
    }

    // If the prop is defined as an event, create our own event setter.
    if moduleHolder?.definition.view?.eventNames.contains(propName) == true {
      return createEventSetter(eventName: propName, bridge: self.manager?.bridge)
    }

    // Otherwise also fall back to the default implementation.
    return super.createPropBlock(propName, isShadowView: isShadowView)
  }

  public override func setProps(_ props: [String: Any], forView view: RCTComponent) {
    guard let view = view as? UIView else {
      log.warn("Given view is not an UIView")
      return
    }
    guard let viewDefinition = moduleHolder?.definition.view else {
      log.warn("View manager '\(self.name)' not found")
      return
    }
    guard let appContext = moduleHolder?.appContext else {
      log.warn("App context has been lost")
      return
    }
    let propsDict = viewDefinition.propsDict()
    var remainingProps = props

    for (key, prop) in propsDict {
      if props.index(forKey: key) == nil {
        continue
      }

      let newValue = props[key] as Any

      // TODO: @tsapeta: Figure out better way to rethrow errors from here.
      try? prop.set(value: Conversions.fromNSObject(newValue), onView: view, appContext: appContext)

      remainingProps.removeValue(forKey: key)
    }

    // Let the base class `RCTComponentData` handle all remaining props.
    super.setProps(remainingProps, forView: view)

    viewDefinition.callLifecycleMethods(withType: .didUpdateProps, forView: view)
  }

  /**
   The base `RCTComponentData` class does some Objective-C dynamic calls in this function, but we don't
   need to do these slow operations since the Sweet API gives us necessary details without reflections.
   */
  public override func viewConfig() -> [String: Any] {
    var propTypes: [String: Any] = [:]
    var directEvents: [String] = []
    let superClass: AnyClass? = managerClass.superclass()

    if let viewDefinition = moduleHolder?.definition.view {
      for prop in viewDefinition.props {
        // `id` allows every type to be passed in
        propTypes[prop.name] = "id"
      }
      for eventName in viewDefinition.eventNames {
        directEvents.append(RCTNormalizeInputEventName(eventName))
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
 Creates a setter for the event prop. Used only by Paper.
 */
private func createEventSetter(eventName: String, bridge: RCTBridge?) -> RCTPropBlockAlias {
  return { [weak bridge] (target: RCTComponent, value: Any) in
    installEventDispatcher(forEvent: eventName, onView: target) { [weak target] (body: [String: Any]) in
      if let target = target {
        let componentEvent = RCTComponentEvent(name: eventName, viewTag: target.reactTag, body: body)
        bridge?.eventDispatcher()?.send(componentEvent)
      }
    }
  }
}

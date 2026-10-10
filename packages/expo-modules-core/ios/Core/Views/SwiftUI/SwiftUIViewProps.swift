// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

internal let GLOBAL_EVENT_NAME = "onGlobalEvent"

extension ExpoSwiftUI {
  public enum IgnoreSafeArea: String, Enumerable {
    case all
    case container
    case keyboard
  }

  /**
   Protocol for view props that support controlling safe area behavior of SwiftUI content. Used by HostView
   */
  public protocol SafeAreaControllable {
    var ignoreSafeArea: IgnoreSafeArea? { get set }
  }

  /**
   Protocol for view props whose hosting view may register the hosted SwiftUI scroll view (a `List`, `ScrollView` or
   `Form` filling the view) as the content scroll view of the view controller it's in. A navigation bar then tracks it
   as it would a UIKit scroll view: the large title collapses and the bar switches to its scrolled appearance.
   */
  public protocol ContentScrollViewProviding {
    var providesContentScrollView: Bool { get }
  }

  /**
   Protocol for view props that receive the view hosting their SwiftUI view, so they can resolve
   their own window. Declare the property `weak`.
   */
  public protocol HostingViewAware: AnyObject {
    var hostingView: UIView? { get set }
  }

  /**
   Base implementation of the view props object for SwiftUI views.
   It's a record that can be observed by SwiftUI to re-render on its changes.
   */
  open class ViewProps: ObservableObject, Record {
    // Stored so `objectWillChange` is a plain property read instead of Combine's O(live objects) side-table lookup.
    public let objectWillChange = ObservableObjectPublisher()

    public required init() {}

    public required init(rawProps: [String: Any], context: AppContext) throws {
      appContext = context
      try updateRawProps(rawProps, appContext: context)
    }

    /**
     An array of views passed by React as children.
     */
    public var children: [any AnyChild]?

    /**
     Proxy for controlling the shadow node (Yoga layout) of the view.
     */
    public internal(set) var shadowNodeProxy: ShadowNodeProxy = ShadowNodeProxy()

    public internal(set) weak var appContext: AppContext?

    /**
     A global event dispatcher that allows views to call `view.dispatchEvent(_:payload)` directly
     */
    public let globalEventDispatcher = EventDispatcher(GLOBAL_EVENT_NAME)

    /**
     A dictionary to store previous raw prop values for change detection.
     */
    private var previousRawProps: [String: Any] = [:]

    internal func updateRawProps(_ rawProps: [String: Any], appContext: AppContext) throws {
      try fieldsOf(self).forEach { field in
        guard let key = field.key else {
          return
        }
        guard rawProps.keys.contains(key) else {
          if field.isRequired {
            try field.set(nil, appContext: appContext)
          }
          return
        }
        let newValue = rawProps[key]
        let previousValue = previousRawProps[key]

        if !Conversions.areValuesEqual(previousValue, newValue) {
          try field.set(newValue, appContext: appContext)

          previousRawProps[key] = newValue
        }
      }

      // Notify subscribed views about the change to re-render them.
      objectWillChange.send()
    }

    internal func setUpEvents(_ dispatcher: @escaping (_ eventName: String, _ payload: Any) -> Void) {
      globalEventDispatcher.handler = { payload in
        dispatcher(GLOBAL_EVENT_NAME, payload)
      }

      let mirror = Mirror(reflecting: self)
      allMirrorChildren(mirror).forEach { (label: String?, value: Any) in
        guard let event = value as? EventDispatcher else {
          return
        }
        guard let eventName = event.customName ?? convertLabelToKey(label) else {
          fatalError("The event has no name")
        }
        event.handler = { payload in
          dispatcher(eventName, payload)
        }
      }
    }
  }
}

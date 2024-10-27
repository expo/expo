// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI
import Combine

/**
 A protocol for SwiftUI views that need to access props.
 */
public protocol ExpoSwiftUIView<Props>: SwiftUI.View {
  associatedtype Props: ExpoSwiftUI.ViewProps

  var props: Props { get }

  init()
}

extension ExpoSwiftUI {
  public typealias View = ExpoSwiftUIView

  /**
   A definition representing the native SwiftUI view to export to React.
   */
  public final class ViewDefinition<Props: ViewProps, ViewType: View<Props>>: ExpoModulesCore.ViewDefinition<HostingView<Props, ViewType>> {
    init(_ viewType: ViewType.Type) {
      super.init(HostingView<Props, ViewType>.self, elements: [])
    }

    public override func createView(appContext: AppContext) -> UIView? {
      let props = Props()
      return HostingView(viewType: ViewType.self, props: props, appContext: appContext)
    }

    public override func getSupportedPropNames() -> [String] {
      // To obtain field names from the props object we need to create a dummy instance first.
      // This is not ideal, but RN requires us to provide all prop names before the view is created
      // and there doesn't seem to be a better way to do this right now.
      let props = Props()
      return fieldsOf(props).compactMap(\.key)
    }
  }
}

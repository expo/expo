// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@ViewProps(extending: ExpoUIViewProps.self)
public struct ListProps {
  var selection: [Either<String, Double>]?
  var onSelectionChange: (ListSelectionChange) -> Void
}

@Record
struct ListSelectionChange {
  var selection: [Either<String, Double>] = []
}

@ExpoView<ListProps>
public struct ListView: View {
  @State private var selection = Set<AnyHashable>()
  @State private var crossAxisSize: CGFloat = 0

  public var body: some View {
    list
      .onGeometryChange(for: CGFloat.self, of: { $0.size.width }, action: { crossAxisSize = $0 })
      .environment(\.containerCrossAxisSize, crossAxisSize)
      .applyExpoUIViewProps(props.base, appContext: appContext)
  }

  @ViewBuilder
  private var list: some View {
    if props.selection != nil {
      List(selection: $selection) {
        children
      }
      .onAppear {
        selection = Self.getHashableSetFromEither(props.selection)
      }
      .onChange(of: props.selection) { newValue in
        selection = Self.getHashableSetFromEither(newValue)
      }
      .onChange(of: selection) { newSelection in
        handleSelectionChange(selection: newSelection)
      }
    } else {
      List {
        children
      }
    }
  }

  func handleSelectionChange(selection: Set<AnyHashable>) {
    let propsSelection = Self.getHashableSetFromEither(props.selection)
    if propsSelection == selection { return }

    let selectionArray: [Either<String, Double>] = selection.compactMap { value in
      if let stringValue = value as? String {
        return Either(stringValue)
      } else if let doubleValue = value as? Double {
        return Either(doubleValue)
      }
      return nil
    }
    props.onSelectionChange(ListSelectionChange(selection: selectionArray))
  }

  private static func getHashableSetFromEither(_ array: [Either<String, Double>]?) -> Set<AnyHashable> {
    guard let array else { return Set() }
    var result = Set<AnyHashable>()
    for item in array {
      if let stringValue: String = item.get() {
        result.insert(stringValue)
      } else if let doubleValue: Double = item.get() {
        result.insert(doubleValue)
      }
    }
    return result
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class ListProps: UIBaseViewProps {
  @Field var selection: [Either<String, Double>]?
  var onSelectionChange = EventDispatcher()
}

struct ListView: ExpoSwiftUI.View {
  @ObservedObject var props: ListProps
  @State private var selection = Set<AnyHashable>()

  var body: some View {
    List(selection: $selection) {
      Children()
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
  }

  func handleSelectionChange(selection: Set<AnyHashable>) {
    let propsSelection = Self.getHashableSetFromEither(props.selection)
    if propsSelection == selection { return }

    let selectionArray: [Any] = selection.compactMap { value in
      if let stringValue = value as? String {
        return stringValue
      } else if let doubleValue = value as? Double {
        return doubleValue
      }
      return nil
    }
    props.onSelectionChange(["selection": selectionArray])
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

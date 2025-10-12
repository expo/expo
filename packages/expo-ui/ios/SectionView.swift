// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SectionProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var title: String?
  @Field var footer: String?
  @Field var collapsible: Bool = false
  var onStateChange = EventDispatcher()
}

internal struct SectionView: ExpoSwiftUI.View {
  @ObservedObject var props: SectionProps
  @State private var isExpanded: Bool = true

  var body: some View {
    Group {
      if #available(iOS 17.0, macOS 14.0, tvOS 17.0, *), props.collapsible {
        collapsibleSection
      } else {
        regularSection
      }
    }
    .modifier(CommonViewModifiers(props: props))
  }

  private var regularSection: some View {
    Section(
      header: Text(props.title ?? "").textCase(nil),
      footer: Text(props.footer ?? "").textCase(nil)
    ) {
      Children()
    }
  }

  @available(iOS 17.0, macOS 14.0, tvOS 17.0, *)
  private var collapsibleSection: some View {
    Section(isExpanded: $isExpanded) {
      Children()
    } header: {
      Text(props.title ?? "").textCase(nil)
    }
    .onChange(of: isExpanded) { newValue in
      props.onStateChange(["isExpanded": newValue])
    }
  }
}

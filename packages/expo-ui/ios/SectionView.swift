// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SectionProps: UIBaseViewProps {
  @Field var title: String?
  @Field var isExpanded: Bool?
  var onIsExpandedChange = EventDispatcher()
}

internal struct SectionView: ExpoSwiftUI.View {
  @ObservedObject var props: SectionProps
  @State private var isExpanded: Bool = true

  var body: some View {
    if #available(iOS 17.0, macOS 14.0, tvOS 17.0, *), let propIsExpanded = props.isExpanded {
      collapsibleSection
        .onAppear {
          isExpanded = propIsExpanded
        }
        .onChange(of: props.isExpanded) { newValue in
          if let newValue {
            isExpanded = newValue
          }
        }
        .onChange(of: isExpanded) { newValue in
          if propIsExpanded != newValue {
            props.onIsExpandedChange(["isExpanded": newValue])
          }
        }
    } else {
      regularSection
    }
  }

  @ViewBuilder
  private var regularSection: some View {
    if let title = props.title, !title.isEmpty {
      Section(title) {
        contentChildren
      }
    } else {
      Section {
        contentChildren
      } header: {
        headerView
      } footer: {
        footerView
      }
    }
  }

  @available(iOS 17.0, macOS 14.0, tvOS 17.0, *)
  @ViewBuilder
  private var collapsibleSection: some View {
    if let title = props.title, !title.isEmpty {
      Section(title, isExpanded: $isExpanded) {
        contentChildren
      }
    } else {
      Section(isExpanded: $isExpanded) {
        contentChildren
      } header: {
        headerView
      }
    }
  }
  
  private var contentChildren: SectionContent? {
    props.children?
      .compactMap({ $0.childView as? SectionContent })
      .first
  }

  private var headerView: SectionHeader? {
    props.children?
      .compactMap({ $0.childView as? SectionHeader })
      .first
  }

  private var footerView: SectionFooter? {
    props.children?
      .compactMap({ $0.childView as? SectionFooter })
      .first
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class BottomSheetProps: UIBaseViewProps {
  @Field var isPresented: Bool = false
  @Field var fitToContents: Bool = false
  @Field var detents: [Either<PresentationDetentPreset, PresentationDetentItem>]?
  @Field var selectedDetent: Either<PresentationDetentPreset, PresentationDetentItem>?
  var onIsPresentedChange = EventDispatcher()
  var onSelectedDetentChange = EventDispatcher()
}

struct SizePreferenceKey: PreferenceKey {
  static var defaultValue: CGSize?

  static func reduce(value: inout CGSize?, nextValue: () -> CGSize?) {
    guard let nextValue = nextValue() else {
      return
    }
    value = nextValue
  }
}

private struct ReadSizeModifier: ViewModifier {
  private var sizeView: some View {
    GeometryReader { geometry in
      Color.clear
        .preference(key: SizePreferenceKey.self, value: geometry.size)
        .allowsHitTesting(false)
    }
  }

  func body(content: Content) -> some View {
    content.background(sizeView)
  }
}

private struct BottomSheetSizeReader<Content: View>: View {
  let content: Content
  let onSizeChange: ((CGSize) -> Void)?

  init(
    content: Content,
    onSizeChange: ((CGSize) -> Void)? = nil
  ) {
    self.content = content
    self.onSizeChange = onSizeChange
  }

  var body: some View {
    content
      .modifier(ReadSizeModifier())
      .onPreferenceChange(SizePreferenceKey.self) { size in
        if let size, let onSizeChange {
          onSizeChange(size)
        }
      }
  }
}

// MARK: - iOS 16+ Sheet Content with Detent Selection

@available(iOS 16.0, tvOS 16.0, *)
private struct SheetContentWithDetents<Content: View>: View {
  let content: Content
  let props: BottomSheetProps
  @State private var selectedDetent: PresentationDetent
  let detentMapping: [PresentationDetent: Either<PresentationDetentPreset, PresentationDetentItem>]
    
    var selectedPreset: PresentationDetentPreset? {
        props.selectedDetent?.get()
    }
    
    var selectedItem: PresentationDetentItem? {
        props.selectedDetent?.get()
    }

  init(content: Content, props: BottomSheetProps) {
    self.content = content
    self.props = props

    // Build the detent mapping
    var mapping: [PresentationDetent: Either<PresentationDetentPreset, PresentationDetentItem>] = [:]
    if let detents = props.detents {
      for detent in detents {
        if let parsed = parsePresentationDetent(detent) {
          mapping[parsed] = detent
        }
      }
    }
    self.detentMapping = mapping

    // Set initial selected detent
    if let initialDetent = props.selectedDetent, let parsed = parsePresentationDetent(initialDetent) {
      self._selectedDetent = State(initialValue: parsed)
    } else {
      self._selectedDetent = State(initialValue: mapping.keys.first ?? .large)
    }
  }

  var body: some View {
    content
      .presentationDetents(Set(detentMapping.keys), selection: $selectedDetent)
      .onChange(of: selectedDetent) { newDetent in
          if let detent = detentMapping[newDetent] {
              if let selectedPreset: PresentationDetentPreset = detent.get() {
                  props.onSelectedDetentChange([
                    "detent": selectedPreset.rawValue
                  ])
              }
              if let selectedItem: PresentationDetentItem = detent.get() {
                  props.onSelectedDetentChange([
                    "detent": selectedItem.toDictionary()
                  ])
              }
          }
      }
      .onChange(of: selectedPreset) { newValue in
          if let parsed = parsePresentationDetent(.init(newValue)) {
              selectedDetent = parsed
          }
      }
      .onChange(of: selectedItem) { newValue in
          if let parsed = parsePresentationDetent(.init(newValue)) {
              selectedDetent = parsed
          }
      }
  }

  private func parseDetents() -> Set<PresentationDetent> {
    guard let detents = props.detents, !detents.isEmpty else {
      return [.large]
    }

    var result: Set<PresentationDetent> = []
    for detent in detents {
      if let parsed = parsePresentationDetent(detent) {
        result.insert(parsed)
      }
    }
    return result.isEmpty ? [.large] : result
  }
}

// MARK: - Main BottomSheetView

struct BottomSheetView: ExpoSwiftUI.View {
  @ObservedObject var props: BottomSheetProps
  @State private var isPresented: Bool
  @State private var childrenSize: CGSize = .zero

  init(props: BottomSheetProps) {
    self.props = props
    self._isPresented = State(initialValue: props.isPresented)
  }

  private func handleSizeChange(_ size: CGSize) {
    guard childrenSize != size else { return }
    childrenSize = size
  }

  @ViewBuilder
  private var sheetContent: some View {
    if props.fitToContents {
      let content = BottomSheetSizeReader(
        content: Children(),
        onSizeChange: handleSizeChange
      )
      if #available(iOS 16.0, tvOS 16.0, *) {
        content.presentationDetents([.height(childrenSize.height)])
      } else {
        content
      }
    } else {
      if #available(iOS 16.0, tvOS 16.0, *), props.detents != nil {
        SheetContentWithDetents(
          content: Children(),
          props: props
        )
      } else {
        Children()
      }
    }
  }

  var body: some View {
    Rectangle().hidden()
      .sheet(isPresented: $isPresented) {
        sheetContent
      }
      .onChange(of: isPresented, perform: { newIsPresented in
        if props.isPresented == newIsPresented {
          return
        }
        props.onIsPresentedChange([
          "isPresented": newIsPresented
        ])
      })
      .onChange(of: props.isPresented) { newValue in
        isPresented = newValue
      }
      .onAppear {
        isPresented = props.isPresented
      }
  }
}

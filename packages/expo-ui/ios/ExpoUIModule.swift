// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class WorkletUIRuntimeException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot find UI worklet runtime"
  }
}

private let WORKLET_RUNTIME_KEY = "_WORKLET_RUNTIME"

public final class ExpoUIModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoUI")

    View(RNHostView.self) {
      Prop("matchContents") { (view, matchContents: Bool) in
        view.matchContents = matchContents
      }
    }

    OnDestroy {
      Task { @MainActor in
        NamespaceRegistry.shared.removeAll()
      }
    }

    // MARK: - Module Functions

    AsyncFunction("completeRefresh") { (id: String) in
      RefreshableManager.shared.completeRefresh(id: id)
    }

    Function("createState") { (initialValue: JavaScriptValue) -> Int in
      SwiftUIStateRegistry.shared.createState(initialValue: initialValue.getRaw())
    }

    Function("deleteState") { (id: Int) in
      SwiftUIStateRegistry.shared.deleteState(id: id)
    }

    Function("initializeWorkletFunctions") {
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      let runtime = try appContext.runtime
      if !runtime.global().hasProperty(WORKLET_RUNTIME_KEY) {
        throw WorkletUIRuntimeException()
      }
      let pointerHolder = runtime.global().getProperty(WORKLET_RUNTIME_KEY)
      if !pointerHolder.isObject() {
        throw WorkletUIRuntimeException()
      }

      let uiRuntime = try appContext.uiRuntime
      let stateObject = uiRuntime.createObject()
      let getValue = uiRuntime.createSyncFunction("getValue", argsCount: 1) { _, args in
        guard let id = args.first?.getInt() else {
          return .undefined
        }
        guard let value = SwiftUIStateRegistry.shared.getValue(id: id) else {
          return .undefined
        }
        return JavaScriptValue.from(value, runtime: uiRuntime)
      }

      let setValue = uiRuntime.createSyncFunction("setValue", argsCount: 2) { _, args in
        guard let id = args.first?.getInt() else {
          return .undefined
        }
        let value = args.count > 1 ? args[1].getRaw() : nil
        SwiftUIStateRegistry.shared.setValue(id: id, value: value)
        return .undefined
      }

      let onChange = uiRuntime.createSyncFunction("onChange", argsCount: 2) { _, args in
        guard let id = args.first?.getInt(),
              args.count > 1,
              args[1].isFunction() else {
          return .undefined
        }
        let callback = args[1].getFunction()
        SwiftUIStateRegistry.shared.onChange(id: id) { newValue in
          let jsValue = JavaScriptValue.from(newValue, runtime: uiRuntime)
          let result = callback.call(withArguments: [jsValue], thisObject: nil, asConstructor: false)
          if result.isUndefined() {
            return nil
          }
          return result.getRaw()
        }
        return .undefined
      }

      stateObject.setProperty("getValue", value: getValue)
      stateObject.setProperty("setValue", value: setValue)
      stateObject.setProperty("onChange", value: onChange)

      uiRuntime.global().setProperty("__expoSwiftUIState", value: stateObject)
    }

    // MARK: - Views with AsyncFunctions that need to explicitly add `.modifier(UIBaseViewModifier(props: props))`

    View(SecureFieldView.self) {
      AsyncFunction("setText") { (view: SecureFieldView, text: String) in
        view.setText(text)
      }
      AsyncFunction("blur") { (view: SecureFieldView) in
        view.blur()
      }
      AsyncFunction("focus") { (view: SecureFieldView) in
        view.focus()
      }
    }
    View(TextFieldView.self) {
      AsyncFunction("setText") { (view: TextFieldView, text: String) in
        view.setText(text)
      }
      AsyncFunction("blur") { (view: TextFieldView) in
        view.blur()
      }
      AsyncFunction("focus") { (view: TextFieldView) in
        view.focus()
      }
      AsyncFunction("setSelection") { (view: TextFieldView, start: Int, end: Int) in
        view.setSelection(start: start, end: end)
      }
    }
    View(ShareLinkView.self) {
      AsyncFunction("setItem") { (view: ShareLinkView, url: String?) in
        guard let url, let validURL = URL(string: url) else {
          view.rejectContinuation()
          return
        }
        view.resolveContinuation(validURL)
      }
    }

    // MARK: - Views don't support common view modifiers

    View(ContextMenuActivationElement.self)
    View(ContextMenuPreview.self)
    View(ContextMenuContent.self)
    View(NamespaceView.self)
    View(PopoverViewContent.self)
    View(PopoverViewPopContent.self)
    View(SectionContent.self)
    View(SectionHeader.self)
    View(SectionFooter.self)
    View(GridRowView.self)
    View(LabeledContentLabel.self)
    View(LabeledContentContent.self)
    View(LabelIcon.self)
    View(HostView.self)
    View(TextView.self)

    // MARK: - Expo UI Views

    ExpoUIView(BottomSheetView.self)
    ExpoUIView(ExpoUI.Button.self)
    ExpoUIView(ChartView.self)
    ExpoUIView(ColorPickerView.self)
    ExpoUIView(DatePickerView.self)
    ExpoUIView(DisclosureGroupView.self)
    ExpoUIView(ExpoUI.ContentUnavailableView.self)
    ExpoUIView(ExpoUI.ContextMenu.self)
    
    // Menu component
    ExpoUIView(MenuView.self)
    View(MenuLabel.self)

    ExpoUIView(FormView.self)
    ExpoUIView(GaugeView.self)
    View(GaugeLabelView.self)
    ExpoUIView(GroupView.self)
    ExpoUIView(HStackView.self)
    ExpoUIView(ImageView.self)
    ExpoUIView(LabelView.self)
    ExpoUIView(ListView.self)
    ExpoUIView(ListForEachView.self)
    ExpoUIView(SyncTextFieldView.self)

    // Picker
    ExpoUIView(PickerView.self)
    View(PickerContentView.self)
    View(PickerLabelView.self)

    ExpoUIView(ExpoUI.ProgressView.self)
    ExpoUIView(SectionView.self)

    // Slider
    ExpoUIView(SliderView.self)
    View(SliderLabelView.self)

    ExpoUIView(SpacerView.self)
    ExpoUIView(StepperView.self)
    ExpoUIView(ToggleView.self)
    ExpoUIView(VStackView.self)
    ExpoUIView(ZStackView.self)
    ExpoUIView(GlassEffectContainerView.self)
    ExpoUIView(LabeledContentView.self)
    ExpoUIView(RectangleView.self)
    ExpoUIView(RoundedRectangleView.self)
    ExpoUIView(EllipseView.self)
    ExpoUIView(UnevenRoundedRectangleView.self)
    ExpoUIView(CapsuleView.self)
    ExpoUIView(CircleView.self)
    ExpoUIView(ConcentricRectangleView.self)
    ExpoUIView(DividerView.self)
    ExpoUIView(PopoverView.self)
    ExpoUIView(GridView.self)
  }
}

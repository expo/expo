// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class ExpoUIModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoUI")

    View(RNHostView.self)

    OnDestroy {
      Task { @MainActor in
        NamespaceRegistry.shared.removeAll()
      }
    }

    // MARK: - Observable State Classes

    Class(ToggleState.self) {
      Constructor { (initialValue: Bool) -> ToggleState in
        let state = ToggleState()
        state.isOn = initialValue
        return state
      }

      Property("isOn") { (state: ToggleState) -> Bool in
        return state.isOn
      }
      .set { (state: ToggleState, value: Bool) in
        state.isOn = value
      }
    }

    // MARK: - Module Functions

    AsyncFunction("completeRefresh") { (id: String) in
      RefreshableManager.shared.completeRefresh(id: id)
    }

    // MARK: - Expo UI Views with AsyncFunctions

    ExpoUIView(SecureFieldView.self) {
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
    ExpoUIView(TextFieldView.self) {
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
    ExpoUIView(ShareLinkView.self) {
      AsyncFunction("setItem") { (view: ShareLinkView, url: String?) in
        guard let url, let validURL = URL(string: url) else {
          view.rejectContinuation()
          return
        }
        view.resolveContinuation(validURL)
      }
    }

    // MARK: - Views don't support common view modifiers

    View(SlotView.self)
    View(NamespaceView.self)
    View(GridRowView.self)
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
    ExpoUIView(ConfirmationDialogView.self)
    ExpoUIView(ExpoUI.ContextMenu.self)

    ExpoUIView(ControlGroupView.self)

    ExpoUIView(MenuView.self)

    ExpoUIView(FormView.self)
    ExpoUIView(GaugeView.self)
    ExpoUIView(GroupView.self)
    ExpoUIView(HStackView.self)
    ExpoUIView(ImageView.self)
    ExpoUIView(LabelView.self)
    ExpoUIView(ListView.self)
    ExpoUIView(ListForEachView.self)

    ExpoUIView(PickerView.self)

    ExpoUIView(ExpoUI.ProgressView.self)
    ExpoUIView(SectionView.self)

    ExpoUIView(SliderView.self)

    ExpoUIView(SpacerView.self)
    ExpoUIView(StepperView.self)
    ExpoUIView(ToggleView.self)
    ExpoUIView(VStackView.self)
    ExpoUIView(ZStackView.self)
    ExpoUIView(GlassEffectContainerView.self)
    ExpoUIView(LabeledContentView.self)
    ExpoUIView(ScrollViewComponent.self)
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
    ExpoUIView(AccessoryWidgetBackgroundView.self)
    ExpoUIView(LinkView.self)
  }
}

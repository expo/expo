// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class ExpoUIModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoUI")

    OnDestroy {
      Task { @MainActor in
        NamespaceRegistry.shared.removeAll()
      }
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

    View(HostView.self)

    // MARK: - Expo UI Views

    ExpoUIView(BottomSheetView.self)
    ExpoUIView(ExpoUI.Button.self)
    ExpoUIView(ChartView.self)
    ExpoUIView(ColorPickerView.self)
    ExpoUIView(DateTimePickerView.self)
    ExpoUIView(DisclosureGroupView.self)
    ExpoUIView(ExpoUI.ContentUnavailableView.self)
    ExpoUIView(ExpoUI.ContextMenu.self)
    ExpoUIView(FormView.self)
    ExpoUIView(GaugeView.self)
    ExpoUIView(GroupView.self)
    ExpoUIView(HStackView.self)
    ExpoUIView(ImageView.self)
    ExpoUIView(LabelView.self)
    ExpoUIView(ListView.self)
    ExpoUIView(PickerView.self)
    ExpoUIView(ExpoUI.ProgressView.self)
    ExpoUIView(SectionView.self)
    ExpoUIView(ShareLinkView.self)
    ExpoUIView(SliderView.self)
    ExpoUIView(SpacerView.self)
    ExpoUIView(StepperView.self)
    ExpoUIView(SwitchView.self)
    ExpoUIView(TextView.self)
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
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

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

    // MARK: - Expo UI Views

    ExpoUIView(BottomSheetView.self)
    ExpoUIView(ExpoUI.Button.self)
    ExpoUIView(ChartView.self)
    ExpoUIView(ColorPickerView.self)
    ExpoUIView(DateTimePickerView.self)
    ExpoUIView(DatePickerView.self)
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
    
    // Picker
    ExpoUIView(PickerView.self)
    View(PickerContentView.self)
    View(PickerLabelView.self)
    
    ExpoUIView(ExpoUI.ProgressView.self)
    ExpoUIView(SectionView.self)
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
    ExpoUIView(GridView.self)
  }
}

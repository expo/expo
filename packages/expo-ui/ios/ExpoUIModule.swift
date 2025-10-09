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

    View(BottomSheetView.self)
    View(Button.self)
    View(ChartView.self)
    View(ColorPickerView.self)
    View(DateTimePickerView.self)
    View(DisclosureGroupView.self)
    View(ExpoUI.ContentUnavailableView.self)
    View(ExpoUI.ContextMenu.self)
    View(ExpoUI.ContextMenuActivationElement.self)
    View(ExpoUI.ContextMenuPreview.self)
    View(ExpoUI.ContextMenuContent.self)
    View(FormView.self)
    View(GaugeView.self)
    View(GroupView.self)
    View(HStackView.self)
    View(HostView.self)
    View(ImageView.self)
    View(LabelView.self)
    View(ListView.self)
    View(PickerView.self)
    View(ProgressView.self)
    View(SectionView.self)
    View(SecureFieldView.self) {
      AsyncFunction("setText") { (view: SecureFieldView, text: String) in
        view.setText(text)
      }
    }
    View(ShareLinkView.self)
    View(SliderView.self)
    View(SpacerView.self)
    View(SwitchView.self)
    View(TextView.self)
    View(TextFieldView.self) {
      AsyncFunction("setText") { (view: TextFieldView, text: String) in
        view.setText(text)
      }
    }
    View(VStackView.self)
    View(ZStackView.self)
    View(NamespaceView.self)
    View(GlassEffectContainerView.self)
    View(LabeledContentView.self)
    View(RectangleView.self)
    View(RoundedRectangleView.self)
    View(EllipseView.self)
    View(UnevenRoundedRectangleView.self)
    View(CapsuleView.self)
    View(CircleView.self)
    View(ConcentricRectangleView.self)
    View(DividerView.self)
  }
}

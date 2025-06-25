// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class ExpoUIModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoUI")

    View(Button.self)
    View(PickerView.self)
    View(SwitchView.self)
    View(SectionView.self)
    View(BottomSheetView.self)
    View(SliderView.self)
    View(ExpoUI.ContextMenu.self)
    View(ExpoUI.ContextMenuActivationElement.self)
    View(ExpoUI.ContextMenuPreview.self)
    View(ColorPickerView.self)
    View(DateTimePickerView.self)
    View(TextFieldView.self)
    View(SecureFieldView.self)
    View(ProgressView.self)
    View(GaugeView.self)
    View(ListView.self)
    View(LabelView.self)
    View(ShareLinkView.self)
    View(HostView.self)

    // Preview components in the "primitives" exports
    View(FormView.self)
    View(HStackView.self)
    View(VStackView.self)
    View(SectionPrimitiveView.self)
    View(TextView.self)
    View(ImageView.self)
    View(SpacerView.self)
    View(GroupView.self)
    View(DisclosureGroupView.self)
  }
}

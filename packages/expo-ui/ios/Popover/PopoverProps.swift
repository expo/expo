import ExpoModulesCore
import SwiftUI

internal class PopoverViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var isPresented: Bool = false
  var onIsPresentedChange = EventDispatcher()
  @Field var attachmentAnchor: PopoverAttachmentAnchorOption?
  @Field var arrowEdge: PopoverArrowEdgeOption?
}

internal final class PopoverViewContentPorps: ExpoSwiftUI.ViewProps {}

internal final class PopoverViewPopContentPorps: ExpoSwiftUI.ViewProps {}

internal enum PopoverAttachmentAnchorOption: String, Enumerable {
  case top
  case center
  case bottom
  case leading
  case trailing

  var anchor: PopoverAttachmentAnchor {
    switch self {
    case .top:
      return .point(.top)
    case .center:
      return .point(.center)
    case .bottom:
      return .point(.bottom)
    case .leading:
      return .point(.leading)
    case .trailing:
      return .point(.trailing)
    }
  }
}

internal enum PopoverArrowEdgeOption: String, Enumerable {
  case top
  case bottom
  case leading
  case trailing
  case none

  var edge: Edge? {
    switch self {
    case .top:
      return .top
    case .bottom:
      return .bottom
    case .leading:
      return .leading
    case .trailing:
      return .trailing
    case .none:
      return nil
    }
  }
}

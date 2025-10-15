import ExpoModulesCore
import SwiftUI

struct Preview: Record {
  @Field var title: String
  @Field var image: String
}

final class ShareLinkViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var item: URL?
  @Field var subject: String?
  @Field var message: String?
  @Field var preview: Preview?
  var onAsyncItemRequest = EventDispatcher()
}

struct ShareLinkView: ExpoSwiftUI.View {
  @ObservedObject var props: ShareLinkViewProps
  private var asyncData: AsyncShareData?

  init(props: ShareLinkViewProps) {
    self.props = props
    if #available(iOS 16.0, tvOS 16.0, *) {
      self.asyncData = AsyncShareData(props: props)
    }
  }

  func resolveContinuation(_ url: URL) {
    if #available(iOS 16.0, tvOS 16.0, *) {
      asyncData?.resolveContinuation(url)
   }
  }

  func rejectContinuation() {
    if #available(iOS 16.0, tvOS 16.0, *) {
      asyncData?.rejectContinuation()
    }
  }

  var body: some View {
#if !os(tvOS)
    Group {
      if #available(iOS 16.0, *) {
        let hasChildren = props.children?.isEmpty == false
        let subject = props.subject.map { Text($0) }
        let message = props.message.map { Text($0) }
        let preview: SharePreview<Image, Never>? = props.preview.flatMap { preview in
          SharePreview(preview.title, image: Image(preview.image))
        }

        if let item = props.item {
          if hasChildren {
            shareLink(
              item: item,
              subject: subject,
              message: message,
              preview: preview
            ) {
              Children()
            }
            .modifier(CommonViewModifiers(props: props))
          } else {
            shareLink(
              item: item,
              subject: subject,
              message: message,
              preview: preview
            )
            .modifier(CommonViewModifiers(props: props))
          }
        } else {
          if let asyncData {
            AsyncShareLinkView(props: props, asyncData: asyncData) {
              Children()
            }.onDisappear {
              // performs continuation cleanup if component is unmounted mid async request
              asyncData.rejectContinuation()
            }
          }
        }
      }
    }
#else
    EmptyView()
#endif
  }

#if !os(tvOS)
  @available(iOS 16.0, *)
  @ViewBuilder
  private func shareLink(
    item: URL,
    subject: Text?,
    message: Text?,
    preview: SharePreview<Image, Never>?,
    @ViewBuilder label: () -> some View
  ) -> some View {
    if let preview = preview {
      SwiftUI.ShareLink(
        item: item,
        subject: subject,
        message: message,
        preview: preview,
        label: label
      )
    } else {
      SwiftUI.ShareLink(
        item: item,
        subject: subject,
        message: message,
        label: label
      )
    }
  }

  @available(iOS 16.0, *)
  @ViewBuilder
  private func shareLink(
    item: URL,
    subject: Text?,
    message: Text?,
    preview: SharePreview<Image, Never>?
  ) -> some View {
    if let preview = preview {
      SwiftUI.ShareLink(
        item: item,
        subject: subject,
        message: message,
        preview: preview
      )
    } else {
      SwiftUI.ShareLink(item: item, subject: subject, message: message)
    }
  }
#endif
}

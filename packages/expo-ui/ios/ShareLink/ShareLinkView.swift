import ExpoModulesCore
import SwiftUI

struct Preview: Record {
  @Field var title: String
  @Field var image: String
}

final class ShareLinkViewProps: UIBaseViewProps {
  @Field var item: String?
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

  @ViewBuilder
  private var shareLink: some View {
#if !os(tvOS)
    if #available(iOS 16.0, *) {
      let hasChildren = props.children?.isEmpty == false
      let subject = props.subject.map { Text($0) }
      let message = props.message.map { Text($0) }
      let preview = props.preview.flatMap { preview in
        SharePreview(preview.title, image: Image(preview.image))
      }

      if let item = props.item {
        if let preview {
          SwiftUI.ShareLink(
            item: item,
            subject: subject,
            message: message,
            preview: preview,
            label: { Children() }
          )
        } else if hasChildren {
          SwiftUI.ShareLink(
            item: item,
            subject: subject,
            message: message,
            label: { Children() }
          )
        } else {
          SwiftUI.ShareLink(
            item: item,
            subject: subject,
            message: message
          )
        }
      } else if let asyncData, let preview {
        if hasChildren {
          SwiftUI.ShareLink(
            item: asyncData,
            subject: subject,
            message: message,
            preview: preview,
            label: { Children() }
          )
        } else {
          SwiftUI.ShareLink(
            item: asyncData,
            subject: subject,
            message: message,
            preview: preview
          )
        }
      }
    }
#else
    EmptyView()
#endif
  }

  var body: some View {
 #if !os(tvOS)
    shareLink.modifier(UIBaseViewModifier(props: props))
      .onDisappear {
        // cleanup if unmounted mid async request
        if #available(iOS 16.0, *) {
          asyncData?.rejectContinuation()
        }
      }
 #else
    EmptyView()
 #endif
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI
import UniformTypeIdentifiers

internal final class AsyncShareableItem {
  var continuation: CheckedContinuation<URL, Error>?

  func setContinuation(_ continuation: CheckedContinuation<URL, Error>) {
    self.continuation = continuation
  }

  func resolve(with url: URL) {
    continuation?.resume(returning: url)
    continuation = nil
  }

  func reject(with error: Error) {
    continuation?.resume(throwing: error)
    continuation = nil
  }
}

internal struct AsyncShareData {
  let props: ShareLinkViewProps
  let asyncShareableItem: AsyncShareableItem
}

// use extension for ios 16+ check
@available(iOS 16.0, *)
extension AsyncShareData: Transferable {
  init(props: ShareLinkViewProps) {
    self.props = props
    self.asyncShareableItem = AsyncShareableItem()
  }

  private enum ShareError: Error {
    case failed
  }

  public func resolveContinuation(_ url: URL) {
    asyncShareableItem.resolve(with: url)
  }

  public func rejectContinuation() {
    asyncShareableItem.reject(with: ShareError.failed)
  }

  static var transferRepresentation: some TransferRepresentation {
    DataRepresentation(exportedContentType: .url) { shareData in
      do {
        let url = try await shareData.getURL()
        return url.absoluteString.data(using: .utf8) ?? Data()
      } catch {
        throw Exception(name: "Failed to get URL", description: error.localizedDescription)
      }
    }
  }

  func getURL() async throws -> URL {
    return try await withCheckedThrowingContinuation { continuation in
      // reject any previous continuation
      asyncShareableItem.reject(with: ShareError.failed)

      asyncShareableItem.setContinuation(continuation)
      props.onAsyncItemRequest()
    }
  }
}

@available(iOS 16.0, *)
struct AsyncShareLinkView<Content: View>: View {
  var props: ShareLinkViewProps
  let asyncData: AsyncShareData?
  let content: () -> Content

  init(props: ShareLinkViewProps, asyncData: AsyncShareData, @ViewBuilder content: @escaping () -> Content) {
    self.props = props
    self.asyncData = asyncData
    self.content = content
  }

  var body: some View {
#if !os(tvOS)
    let hasChildren = props.children?.isEmpty == false
    let subject = props.subject.map { Text($0) }
    let message = props.message.map { Text($0) }
    let preview: SharePreview<Image, Never>? = props.preview.flatMap { preview in
      SharePreview(preview.title, image: Image(preview.image))
    }

    if let asyncData {
      if hasChildren {
        asyncShareLink(
            item: asyncData,
            subject: subject,
            message: message,
            preview: preview
          ) {
            content()
        }.modifier(CommonViewModifiers(props: props))
      } else {
        asyncShareLink(
            item: asyncData,
            subject: subject,
            message: message,
            preview: preview
        ).modifier(CommonViewModifiers(props: props))
      }
    }
#else
    EmptyView()
#endif
  }

#if !os(tvOS)
  @ViewBuilder
  private func asyncShareLink(
    item: AsyncShareData,
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
    }
  }

  @ViewBuilder
  private func asyncShareLink(
    item: AsyncShareData,
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
    }
  }
#endif
}

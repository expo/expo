// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI
import UniformTypeIdentifiers

internal final class AsyncShareableItem {
  private let queue = DispatchQueue(label: "expo.asyncshareableitemqueue")
  var continuation: CheckedContinuation<URL, Error>?

  func setContinuation(_ continuation: CheckedContinuation<URL, Error>, callback: @escaping () -> Void) {
    queue.async {
      self.continuation = continuation
      callback()
    }
  }

  func resolve(with url: URL) {
    queue.async {
      self.continuation?.resume(returning: url)
      self.continuation = nil
    }
  }

  func reject(with error: Error) {
    queue.async {
      self.continuation?.resume(throwing: error)
      self.continuation = nil
    }
  }
}

internal struct AsyncShareData {
  let props: ShareLinkViewProps
  let asyncShareableItem: AsyncShareableItem
}

// use extension for ios 16+ check
@available(iOS 16.0, tvOS 16.0, *)
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

      asyncShareableItem.setContinuation(continuation) {
        props.onAsyncItemRequest()
      }
    }
  }
}

@available(iOS 16.0, *)
internal struct AsyncShareLinkView<Content: View>: View {
  var props: ShareLinkViewProps
  let asyncData: AsyncShareData?
  let subject: Text?
  let message: Text?
  let preview: SharePreview<Image, Never>?
  let content: () -> Content

  init(
    props: ShareLinkViewProps,
    asyncData: AsyncShareData,
    subject: Text?,
    message: Text?,
    preview: SharePreview<Image, Never>?,
    @ViewBuilder content: @escaping () -> Content
  ) {
    self.props = props
    self.asyncData = asyncData
    self.subject = subject
    self.message = message
    self.preview = preview
    self.content = content
  }

  var body: some View {
#if !os(tvOS)
    let hasChildren = props.children?.isEmpty == false

    if let item = asyncData, let preview {
      if hasChildren {
         SwiftUI.ShareLink(
          item: item,
          subject: subject,
          message: message,
          preview: preview,
          label: content
        ).modifier(CommonViewModifiers(props: props))
      } else {
        SwiftUI.ShareLink(
          item: item,
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
}


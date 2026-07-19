// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

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

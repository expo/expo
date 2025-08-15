// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

// [alan] Gravatar urls do not work with AsyncImage. We need to download the image ourseleves
struct Avatar<Content: View, Placeholder: View>: View {
  let url: URL
  let content: (Image) -> Content
  let placeholder: () -> Placeholder

  @State private var image: UIImage?
  @State private var isLoading = false

  init(
    url: URL,
    @ViewBuilder content: @escaping (Image) -> Content,
    @ViewBuilder placeholder: @escaping () -> Placeholder
  ) {
    self.url = url
    self.content = content
    self.placeholder = placeholder
  }

  var body: some View {
    Group {
      if let image = image {
        content(Image(uiImage: image))
      } else {
        placeholder()
      }
    }
    .task {
      await loadImage()
    }
  }

  private func loadImage() async {
    guard !isLoading else {
      return
    }
    isLoading = true

    do {
      let config = URLSessionConfiguration.ephemeral
      config.protocolClasses = []
      let session = URLSession(configuration: config)

      let (data, _) = try await session.data(from: url)

      if let uiImage = UIImage(data: data) {
        await MainActor.run {
          self.image = uiImage
          self.isLoading = false
        }
      } else {
        await MainActor.run {
          self.isLoading = false
        }
      }
    } catch {
      await MainActor.run {
        self.isLoading = false
      }
    }
  }
}

// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

// Gravatar URLs do not work with AsyncImage because React Native registers
// custom URL protocol handlers that intercept the requests. We bypass them
// with an ephemeral session that has no custom protocol classes.
private let avatarImageSession: URLSession = {
  let config = URLSessionConfiguration.ephemeral
  config.protocolClasses = []
  return URLSession(configuration: config)
}()

struct Avatar<Content: View, Placeholder: View>: View {
  let url: URL
  let content: (Image) -> Content
  let placeholder: () -> Placeholder

  @State private var image: UIImage?

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
      if let image {
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
    do {
      let (data, _) = try await avatarImageSession.data(from: url)

      if let uiImage = UIImage(data: data) {
        self.image = uiImage
      }
    } catch {
      // Image load failed or was cancelled
    }
  }
}

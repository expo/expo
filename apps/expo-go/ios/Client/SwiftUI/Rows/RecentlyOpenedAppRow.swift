//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct RecentlyOpenedAppRow: View {
  let app: RecentlyOpenedApp
  let onTap: () -> Void

  var body: some View {
    Button {
      onTap()
    } label: {
      HStack(spacing: 12) {
        if let iconUrl = app.iconUrl, let url = URL(string: iconUrl) {
          RecentlyOpenedIconView(url: url)
        }

        Text(app.name)
          .font(.body)
          .fontWeight(.semibold)
          .foregroundColor(.primary)

        Spacer()

        Image(systemName: "chevron.right")
          .font(.caption)
          .foregroundColor(.secondary)
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    }
    .buttonStyle(PlainButtonStyle())
  }
}

private struct RecentlyOpenedIconView: View {
  let url: URL
  private let size: CGFloat = 40
  @State private var image: UIImage?
  @State private var isLoading = false

  var body: some View {
    Group {
      if let image {
        Image(uiImage: image)
          .resizable()
          .scaledToFill()
          .frame(width: size, height: size)
          .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
      } else {
        RoundedRectangle(cornerRadius: BorderRadius.medium)
          .fill(Color.expoSecondarySystemGroupedBackground)
          .frame(width: size, height: size)
      }
    }
    .task {
      await loadImage()
    }
  }

  private func loadImage() async {
    guard !isLoading else { return }
    isLoading = true

    do {
      let config = URLSessionConfiguration.ephemeral
      config.protocolClasses = []
      let session = URLSession(configuration: config)
      let (data, response) = try await session.data(from: url)

      guard let httpResponse = response as? HTTPURLResponse,
            (200..<300).contains(httpResponse.statusCode),
            !data.isEmpty,
            let uiImage = UIImage(data: data) else {
        await MainActor.run {
          self.isLoading = false
        }
        return
      }

      await MainActor.run {
        self.image = uiImage
        self.isLoading = false
      }
    } catch {
      await MainActor.run {
        self.isLoading = false
      }
    }
  }
}

//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct DevServerRow: View {
  let server: DevelopmentServer
  var isLoading: Bool = false
  let onTap: () -> Void

  var body: some View {
    Button {
      onTap()
    }
    label: {
      HStack(spacing: 12) {
        DevServerIcon(source: server.source, iconUrl: server.iconUrl)

        VStack(alignment: .leading, spacing: 2) {
          Text(server.description.isEmpty ? server.url : server.description)
            .fontWeight(.semibold)
            .foregroundColor(.primary)

          if server.description != server.url {
            Text(server.url)
              .font(.caption)
              .foregroundColor(.secondary)
              .lineLimit(1)
          }
        }

        Spacer()

        if isLoading {
          ProgressView()
        } else {
          Image(systemName: "chevron.right")
            .font(.caption)
            .foregroundColor(.secondary)
        }
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    }
    .buttonStyle(PlainButtonStyle())
  }
}

private struct DevServerIcon: View {
  let source: String
  let iconUrl: String?
  private let size: CGFloat = 40
  @State private var image: UIImage?
  @State private var isLoading = false
  @Environment(\.colorScheme) private var colorScheme

  var body: some View {
    Group {
      if let image {
        Image(uiImage: image)
          .resizable()
          .scaledToFill()
          .frame(width: size, height: size)
          .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
      } else {
        let imageName = source == "snack" ? "snack" : "cli"
        Image(imageName)
          .resizable()
          .scaledToFill()
          .frame(width: size, height: size)
          .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
      }
    }
    .task {
      await loadImage()
    }
  }

  private func loadImage() async {
    guard let iconUrl, let url = URL(string: iconUrl), !isLoading else { return }
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
        await MainActor.run { self.isLoading = false }
        return
      }

      await MainActor.run {
        self.image = uiImage
        self.isLoading = false
      }
    } catch {
      await MainActor.run { self.isLoading = false }
    }
  }
}

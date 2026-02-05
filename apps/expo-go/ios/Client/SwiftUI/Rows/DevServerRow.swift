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
      HStack {
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
  @Environment(\.colorScheme) private var colorScheme

  var body: some View {
    let background = colorScheme == .dark ? Color.expoSecondarySystemGroupedBackground : Color.white
    let imageName = source == "snack" ? "snack" : "cli"

    RemoteIconView(iconUrl: iconUrl, fallbackImageName: imageName)
      .frame(width: 28, height: 28)
      .padding(10)
      .background(background)
      .clipShape(RoundedRectangle(cornerRadius: 8))
      .overlay(
        RoundedRectangle(cornerRadius: 8)
          .stroke(Color.expoSystemGray4.opacity(0.6), lineWidth: 1)
      )
  }
}

private struct RemoteIconView: View {
  let iconUrl: String?
  let fallbackImageName: String
  @State private var image: UIImage?
  @State private var isLoading = false

  var body: some View {
    Group {
      if let image {
        Image(uiImage: image)
          .resizable()
          .frame(width: 40, height: 40)
          .clipShape(RoundedRectangle(cornerRadius: 8))
      } else {
        Image(fallbackImageName)
          .resizable()
          .frame(width: 40, height: 40)
          .clipShape(RoundedRectangle(cornerRadius: 8))
      }
    }
    .task {
      await loadImageIfNeeded()
    }
  }

  private func loadImageIfNeeded() async {
    guard let iconUrl, let url = URL(string: iconUrl), !isLoading else {
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

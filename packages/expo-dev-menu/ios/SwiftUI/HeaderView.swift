import SwiftUI

struct HeaderView: View {
  @EnvironmentObject var viewModel: DevMenuViewModel
  @State private var appIcon: UIImage? = nil

  var body: some View {
    HStack(spacing: 12) {
      if let icon = appIcon {
        Image(uiImage: icon)
          .resizable()
          .scaledToFit()
          .frame(width: 38, height: 38)
          .clipShape(RoundedRectangle(cornerRadius: 16))
      }

      versionInfo

      Spacer()

      Button {
        viewModel.hideMenu()
      } label: {
        ZStack {
          Circle()
          #if os(tvOS)
            .fill(Color.expoSystemGray4.opacity(0.2))
          #else
            .fill(Color.expoSystemGray6)
          #endif
            .frame(width: 36, height: 36)

          Image(systemName: "xmark")
            .font(.headline)
            .tint(.gray.opacity(0.6))
        }
      }
    }
    .onChange(of: viewModel.appInfo?.appIcon) { newIconPath in
      Task {
        await loadIcon(from: newIconPath)
      }
    }
    .task {
      await loadIcon(from: viewModel.appInfo?.appIcon)
    }
    .padding()
  }

  private func loadIcon(from path: String?) async {
    guard let path, let url = URL(string: path) else {
      appIcon = nil
      return
    }

    if url.isFileURL {
      appIcon = UIImage(contentsOfFile: url.path)
    } else {
      do {
        let (data, _) = try await URLSession.shared.data(from: url)
        if let loadedImage = UIImage(data: data) {
          appIcon = loadedImage
        }
      } catch {
        appIcon = nil
      }
    }
  }

  private var versionInfo: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(viewModel.appInfo?.appName ?? "")
        .font(.headline)
        .fontWeight(.bold)
        .lineLimit(1)

      if let runtimeVersion = viewModel.appInfo?.runtimeVersion {
        Text("Runtime version: \(runtimeVersion)")
          .font(.caption)
          .foregroundColor(.secondary)
      }

      if let sdkVersion = viewModel.appInfo?.sdkVersion {
        Text("SDK version: \(sdkVersion)")
          .font(.caption)
          .foregroundColor(.secondary)
      }
    }
  }
}

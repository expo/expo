import SwiftUI

func loadAppIcon(from path: String) -> UIImage? {
  if let url = URL(string: path), url.isFileURL {
    return UIImage(contentsOfFile: url.path)
  }
  return nil
}

struct HeaderView: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    HStack(spacing: 12) {
      if let iconPath = viewModel.appInfo?.appIcon,
        let image = loadAppIcon(from: iconPath) {
        Image(uiImage: image)
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
    .padding()
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

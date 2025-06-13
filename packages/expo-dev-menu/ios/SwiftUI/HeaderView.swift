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
          .aspectRatio(contentMode: .fit)
          .frame(width: 42, height: 42)
          .clipShape(RoundedRectangle(cornerRadius: 8))
      }

      versionInfo

      Spacer()

      Button {
        viewModel.hideMenu()
      } label: {
        Image(systemName: "xmark")
          .font(.title2)
          .foregroundColor(.primary)
          .frame(width: 24, height: 24)
      }
    }
    .padding(.horizontal)
    .padding(.vertical, 12)
    .background(Color(.systemBackground))
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

#Preview {
  HeaderView()
}

import SwiftUI

struct DevMenuAppInfo: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    VStack(spacing: 0) {
      InfoRow(title: "Version", value: viewModel.appInfo?.appVersion ?? "Unknown")

      if let runtimeVersion = viewModel.appInfo?.runtimeVersion {
        Divider()
        InfoRow(title: "Runtime version", value: runtimeVersion)
      } else if let sdkVersion = viewModel.appInfo?.sdkVersion {
        Divider()
        InfoRow(title: "SDK Version", value: sdkVersion)
      }

      Divider()

      Button {
        viewModel.copyAppInfo()
      }
      label: {
        HStack {
          Text(viewModel.clipboardMessage ?? "Tap to Copy All")
            .foregroundColor(.blue)
          Spacer()
        }
        .padding()
      }
      .disabled(viewModel.clipboardMessage != nil)
      .background(Color(.systemBackground))
    }
    .background(Color(.systemBackground))
    .cornerRadius(12)
    .padding(.horizontal)
    .padding(.vertical, 8)
  }
}

struct InfoRow: View {
  let title: String
  let value: String

  var body: some View {
    HStack {
      Text(title)
        .foregroundColor(.primary)

      Spacer()

      Text(value)
        .foregroundColor(.primary)
        .lineLimit(2)
    }
    .padding()
  }
}

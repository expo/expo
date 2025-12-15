import SwiftUI

// swiftlint:disable closure_body_length

struct DevMenuAppInfo: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    VStack(alignment: .leading) {
      Text("SYSTEM")
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 0) {
        Divider()

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
            Text(viewModel.clipboardMessage ?? "Copy system info")
              .foregroundColor(.blue)
            Spacer()
            Image(systemName: "document.on.clipboard")
              .resizable()
              .frame(width: 16, height: 16)
              .opacity(0.6)
          }
          .padding(.vertical)
          .disabled(viewModel.clipboardMessage != nil)
        }
      }
      .background(Color.expoSystemBackground)
      .cornerRadius(18)
    }
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
    .padding(.vertical)
  }
}
// swiftlint:enable closure_body_length

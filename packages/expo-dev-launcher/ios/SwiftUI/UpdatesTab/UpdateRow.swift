import SwiftUI

struct UpdateRow: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  let update: Update
  let isCompatible: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(alignment: .top) {
        Image("update-icon", bundle: getDevLauncherBundle())
          .resizable()
          .frame(width: 16, height: 16)

        UpdateInfo(update: update, isCompatible: isCompatible)

        Spacer()

        openButton
      }
    }
    .padding()
    .background(Color.expoSecondarySystemBackground)
    .cornerRadius(12)
  }

  private var openButton: some View {
    Button {
      launchUpdate(update)
    } label: {
      if isOpening {
        ProgressView()
          .controlSize(.small)
      } else {
        Text("Open")
      }
    }
    .buttonStyle(.bordered)
    #if !os(tvOS)
    .controlSize(.small)
    #endif
    .disabled(!isCompatible || viewModel.isLoadingServer)
  }

  private func launchUpdate(_ update: Update) {
    viewModel.openApp(url: updateURL)
  }

  private var updateURL: String {
    formatUpdateUrl(update.manifestPermalink, update.message)
  }

  private var isOpening: Bool {
    viewModel.loadingAppURL == updateURL
  }
}

struct UpdateInfo: View {
  let update: Update
  let isCompatible: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text("Update \"\(update.message.isEmpty ? update.id : update.message)\"")
        .font(.system(size: 15, weight: .semibold))
        .lineLimit(3)

      Text("Published \(formattedUpdateDate(update.createdAt))")
        .font(.caption)
        .foregroundStyle(.secondary)

      if !isCompatible {
        Text("Incompatible update")
          .font(.caption.weight(.medium))
          .foregroundStyle(.orange)
      }
    }
  }
}

struct BranchBadge: View {
  let branchName: String

  var body: some View {
    HStack(spacing: 2) {
      Image("branch-icon", bundle: getDevLauncherBundle())
        .resizable()
        .frame(width: 10, height: 10)
      Text("Branch:  \(branchName)")
    }
    .padding(4)
    .background(Color.blue.opacity(0.2))
    .clipShape(RoundedRectangle(cornerRadius: 4))
    .font(.caption)
  }
}

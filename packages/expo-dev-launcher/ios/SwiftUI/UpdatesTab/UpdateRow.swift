import SwiftUI

struct UpdateRow: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  let update: Update
  let branchName: String
  let isCompatible: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
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

      HStack(alignment: .top) {
        Image("update-icon", bundle: getDevLauncherBundle())
          .resizable()
          .frame(width: 16, height: 16)

        VStack(alignment: .leading, spacing: 4) {
          Text("Update \"\(update.message.isEmpty ? update.id : update.message)\"")
            .font(.system(size: 15, weight: .semibold))
            .lineLimit(3)

          Text("Published \(update.createdAt)")
            .font(.caption)
            .foregroundStyle(.secondary)
        }

        Spacer()

        Button {
          launchUpdate(update)
        } label: {
           Text("Open")
        }
        .buttonStyle(.bordered)
        .controlSize(.small)
        .disabled(!isCompatible)
      }
    }
    .padding(.vertical, 4)
  }

  private func launchUpdate(_ update: Update) {
    let updateUrl = formatUpdateUrl(update.manifestPermalink, update.message)
    viewModel.openApp(url: updateUrl)
  }
}

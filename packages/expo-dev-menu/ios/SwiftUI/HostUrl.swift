import SwiftUI

struct HostUrl: View {
  let hostUrl: String
  let onCopy: (String) -> Void
  let copiedMessage: String?

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("Connected to:")
        .font(.subheadline)
        .foregroundColor(.secondary)

      Button {
        onCopy(hostUrl)
      } label: {
        HStack {
          Circle()
            .fill(Color.green)
            .frame(width: 10, height: 10)

          Text(copiedMessage ?? hostUrl)
            .font(.system(.caption, design: .monospaced))
            .foregroundColor(.primary)
            .lineLimit(2)

          Spacer()

          Image(systemName: "doc.on.clipboard")
            .foregroundColor(.secondary)
        }
        #if !os(tvOS)
        .background(Color(.systemBackground))
        #endif
        .cornerRadius(8)
      }
      .buttonStyle(.plain)
    }
    .padding()
    #if !os(tvOS)
    .background(Color(.systemBackground))
    #endif
  }
}

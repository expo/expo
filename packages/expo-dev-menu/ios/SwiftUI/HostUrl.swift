import SwiftUI

struct HostUrl: View {
  let hostUrl: String
  let onCopy: (String) -> Void
  let copiedMessage: String?

  var body: some View {
    Button {
      onCopy(hostUrl)
    } label: {
      HStack {
        VStack(alignment: .leading) {
          Text("Connected to:")
            .font(.subheadline)
            .foregroundColor(.secondary)

          Text(copiedMessage ?? hostUrl)
            .font(.subheadline)
            .foregroundColor(.primary)
            .lineLimit(2)
        }

        Spacer()

        Image(systemName: "doc.on.clipboard")
          .resizable()
          .scaledToFit()
          .frame(width: 16, height: 16)
          .foregroundColor(.secondary)
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(20)
    }
    .buttonStyle(.plain)
  }
}

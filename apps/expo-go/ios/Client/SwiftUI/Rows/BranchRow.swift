//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct BranchRow: View {
  let branch: BranchDetail
  let onTap: () -> Void

  var body: some View {
    Button {
      onTap()
    } label: {
      HStack(spacing: 12) {
        VStack(alignment: .leading, spacing: 4) {
          Text(branch.name)
            .font(.body)
            .fontWeight(.semibold)
            .foregroundColor(.primary)

          if let update = branch.updates.first {
            if let message = update.message, !message.isEmpty {
              Text(message)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(1)
            }

            if let sdkVersion = update.expoGoSDKVersion {
              Text("SDK \(sdkVersion)")
                .font(.caption2)
                .foregroundColor(.secondary)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.expoSecondarySystemGroupedBackground)
                .clipShape(RoundedRectangle(cornerRadius: 4))
            }
          }
        }

        Spacer()

        Image(systemName: "chevron.right")
          .font(.caption)
          .foregroundColor(.secondary)
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    .buttonStyle(PlainButtonStyle())
  }
}

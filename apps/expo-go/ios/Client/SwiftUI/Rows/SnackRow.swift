//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct SnackRow: View {
  let snack: Snack
  var isLoading: Bool = false
  let onTap: () -> Void

  private var isSupported: Bool {
    return isSDKCompatible(snack.sdkVersion)
  }

  var body: some View {
    Button {
      onTap()
    } label: {
      HStack {
        VStack(alignment: .leading, spacing: 4) {
          Text(snack.name)
            .font(.body)
            .fontWeight(.semibold)
            .foregroundColor(.primary)
            .opacity(isSupported ? 1 : 0.5)

          if let description = snack.description, !description.isEmpty {
            Text(description)
              .font(.caption)
              .foregroundColor(.secondary)
              .lineLimit(1)
          } else {
            Text(snack.fullName)
              .font(.caption)
              .foregroundColor(.secondary)
          }

          HStack(spacing: 6) {
            if !isSupported {
              Text("Unsupported SDK (\(snack.sdkVersion))")
                .font(.caption2)
                .foregroundColor(.secondary)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.expoSecondarySystemGroupedBackground)
                .clipShape(RoundedRectangle(cornerRadius: BorderRadius.small))
            }

            if snack.isDraft {
              Text("Draft")
                .font(.caption2)
                .foregroundColor(.secondary)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.expoSecondarySystemGroupedBackground)
                .clipShape(RoundedRectangle(cornerRadius: BorderRadius.small))
            }
          }
        }

        Spacer()

        if isLoading {
          ProgressView()
        } else {
          Image(systemName: "chevron.right")
            .font(.caption)
            .foregroundColor(.secondary)
        }
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    }
    .buttonStyle(PlainButtonStyle())
  }
}

//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct BranchRow: View {
  let branch: BranchDetail
  let onTap: () -> Void

  var body: some View {
    Button {
      onTap()
    } label: {
      BranchRowContent(branch: branch)
    }
    .buttonStyle(PlainButtonStyle())
  }
}

struct BranchRowContent: View {
  let branch: BranchDetail

  var body: some View {
    HStack(spacing: 12) {
      VStack(alignment: .leading, spacing: 4) {
        HStack {
          Image("branch-icon")
          Text("Branch: \(branch.name)")
            .font(.body)
            .fontWeight(.semibold)
            .foregroundColor(.primary)
        }

        if let update = branch.updates.first {
          if let message = update.message, !message.isEmpty {
            HStack {
              Image("update-icon")
              Text("\"\(message)\"")
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(1)
            }
          }
          
          Text("Published \(formattedDate(update.createdAt))")
            .font(.caption)
            .foregroundColor(.secondary)
        }
      }

      Spacer()

      Image(systemName: "chevron.right")
        .font(.caption)
        .foregroundColor(.secondary)
    }
    .padding()
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
  }
  
  private func formattedDate(_ value: String) -> String {
    let formatters = [
      isoFormatter(withFractionalSeconds: true),
      isoFormatter(withFractionalSeconds: false)
    ]
    for formatter in formatters {
      if let date = formatter.date(from: value) {
        let display = DateFormatter()
        display.locale = Locale(identifier: "en_US_POSIX")
        display.dateFormat = "MMM d, yyyy h:mm a"
        return display.string(from: date)
      }
    }
    return value
  }

  private func isoFormatter(withFractionalSeconds: Bool) -> ISO8601DateFormatter {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [
      .withInternetDateTime,
      .withDashSeparatorInDate,
      .withColonSeparatorInTime
    ]
    if withFractionalSeconds {
      formatter.formatOptions.insert(.withFractionalSeconds)
    }
    return formatter
  }
}

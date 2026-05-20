//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct UpdateRow: View {
  let update: AppUpdate
  let isCompatible: Bool
  var isLoading: Bool = false
  let onOpen: () -> Void

  var body: some View {
    Button {
      if isCompatible {
        onOpen()
      }
    } label: {
      HStack(alignment: .top, spacing: 8) {
        Image("update-icon")
          .foregroundColor(.secondary)
          .padding(.top, 2)

        VStack(alignment: .leading, spacing: 6) {
          Text(updateTitle(update))
            .font(.body)
            .fontWeight(.semibold)
            .foregroundColor(.primary)
            .lineLimit(1)

          Text("Published \(formattedDate(update.createdAt))")
            .font(.caption)
            .foregroundColor(.secondary)
            .lineLimit(1)

          if !isCompatible {
            Text("Not compatible with this version of Expo Go")
              .font(.caption)
              .foregroundColor(.secondary)
              .lineLimit(1)
          }
        }

        Spacer()

        if isLoading {
          ProgressView()
        } else if isCompatible {
          Image(systemName: "chevron.right")
            .font(.caption)
            .foregroundColor(.secondary)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    }
    .buttonStyle(PlainButtonStyle())
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

  private func updateTitle(_ update: AppUpdate) -> String {
    if let message = update.message, !message.isEmpty {
      return "\"\(message)\""
    }
    return update.id
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

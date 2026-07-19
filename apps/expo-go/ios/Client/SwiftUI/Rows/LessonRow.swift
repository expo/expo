// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct LessonRow: View {
  let lesson: Lesson
  let isCompleted: Bool
  let isLoading: Bool
  let onTap: () -> Void

  var body: some View {
    Button(action: onTap) {
      HStack(spacing: 12) {
        // Icon in rounded square
        Image(systemName: lesson.icon)
          .font(.system(size: 16, weight: .semibold))
          .foregroundColor(.white)
          .frame(width: 36, height: 36)
          .background(Color.expoBlue)
          .cornerRadius(BorderRadius.medium)

        // Lesson title and number
        VStack(alignment: .leading, spacing: 2) {
          Text(lesson.title)
            .font(.body)
            .fontWeight(.medium)
            .foregroundColor(.primary)
          Text("Lesson \(lesson.id)")
            .font(.caption)
            .foregroundColor(.secondary)
        }

        Spacer()

        // Loading spinner, completion checkmark, or chevron
        if isLoading {
          ProgressView()
        } else if isCompleted {
          Image(systemName: "checkmark.circle.fill")
            .font(.system(size: 20))
            .foregroundColor(.green)
        } else {
          Image(systemName: "chevron.right")
            .font(.caption)
            .foregroundColor(.secondary)
        }
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(BorderRadius.large)
    }
    .buttonStyle(PlainButtonStyle())
  }
}

//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct AppInfoRow: View {
  let label: String
  let value: String

  var body: some View {
    HStack {
      Text(label)
        .font(.body)
        .foregroundColor(.primary)

      Spacer()

      Text(value)
        .font(.caption)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.trailing)
    }
    .padding()
  }
}

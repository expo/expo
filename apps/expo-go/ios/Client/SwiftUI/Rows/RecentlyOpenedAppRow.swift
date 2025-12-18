//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct RecentlyOpenedAppRow: View {
  let app: RecentlyOpenedApp
  let onTap: () -> Void

  var body: some View {
    Button {
      onTap()
    } label: {
      HStack(spacing: 12) {
        if let iconUrl = app.iconUrl, let url = URL(string: iconUrl) {
          Avatar(url: url) { image in
            image
              .resizable()
              .scaledToFill()
          } placeholder: {
            Color.clear
          }
          .frame(width: 40, height: 40)
          .clipShape(RoundedRectangle(cornerRadius: 8))
        }

        VStack(alignment: .leading, spacing: 2) {
          Text(app.name)
            .font(.body)
            .fontWeight(.semibold)
            .foregroundColor(.primary)
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

//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct SectionHeader: View {
  let title: String
  var actionTitle: String?
  var action: (() -> Void)?

  var body: some View {
    HStack {
      Text(title)
        .expoSectionHeader()

      Spacer()

      if let actionTitle = actionTitle, let action = action {
        Button(actionTitle) {
          action()
        }
        .font(.expoCaption())
        .foregroundColor(.expoBlue)
      }
    }
  }
}

// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct PartnerBadge: View {
  var body: some View {
    Image(systemName: "link")
      .font(.system(size: 7, weight: .bold))
      .foregroundStyle(.white)
      .frame(width: 12, height: 12)
      .background(Color.expoBlue, in: .rect(cornerRadius: 3))
      .overlay {
        RoundedRectangle(cornerRadius: 3)
          .stroke(Color.expoSystemBackground, lineWidth: 1)
      }
      .accessibilityLabel("Partner account")
  }
}

// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct PartnerBadge: View {
  var body: some View {
    Text("Partner")
      .font(.caption2.weight(.semibold))
      .foregroundStyle(.secondary)
      .padding(.horizontal, 6)
      .padding(.vertical, 2)
      .background(Color.expoSystemGray5, in: Capsule())
  }
}

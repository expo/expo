//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct SnacksSection: View {
  @EnvironmentObject var viewModel: HomeViewModel

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionHeader(title: "SNACKS")

      VStack(spacing: 6) {
        ForEach(viewModel.snacks.prefix(3)) { snack in
          SnackRow(snack: snack)
        }

        if viewModel.snacks.count > 3 {
          Button("See all snacks") {
            // TODO: Navigate to snacks list
          }
          .frame(maxWidth: .infinity)
          .padding()
          .background(Color.expoSecondarySystemGroupedBackground)
          .clipShape(RoundedRectangle(cornerRadius: 12))
        }
      }
    }
  }
}

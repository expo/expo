//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ProjectsSection: View {
  @EnvironmentObject var viewModel: HomeViewModel

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionHeader(title: "PROJECTS")

      VStack(spacing: 6) {
        ForEach(viewModel.projects.prefix(3)) { project in
          ProjectRow(project: project)
        }

        if viewModel.projects.count > 3 {
          Button("See all projects") {
            // TODO: Navigate to projects list
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

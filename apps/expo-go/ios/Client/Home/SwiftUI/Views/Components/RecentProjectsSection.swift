import SwiftUI

struct RecentProjectsSection: View {
  @EnvironmentObject var viewModel: HomeViewModel
  
  var body: some View {
    if !viewModel.recentProjects.isEmpty {
      VStack(alignment: .leading, spacing: 20) {
        HStack {
          Text("Recently opened")
            .font(.caption)
            .fontWeight(.semibold)
          
          Spacer()
          
          Button("CLEAR") {
            viewModel.clearRecentProjects()
          }
          .font(.system(size: 12, weight: .semibold))
        }
        
        LazyVStack(spacing: 0) {
          ForEach(viewModel.recentProjects) { project in
            RecentlyOpenedRow(project: project) {
              viewModel.openProject(url: project.manifestUrl ?? "")
            }
            Divider()
          }
        }
        .cardStyle()
      }
    }
  }
}

struct RecentProjectsSection_Previews: PreviewProvider {
  static var previews: some View {
    List {
      RecentProjectsSection()
    }
    .environmentObject(HomeViewModel())
  }
}

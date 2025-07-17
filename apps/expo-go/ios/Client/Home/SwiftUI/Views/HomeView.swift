import SwiftUI

struct HomeView: View {
  @State private var selectedProject: Project?
  @State private var showingInfoDialog = false
  @EnvironmentObject var viewModel: HomeViewModel
  
  var body: some View {
    NavigationView {
      VStack(spacing: 0) {
        HomeNavigationHeader()
        
        ScrollView {
          VStack(spacing: 35) {
            DevelopmentServersSection(showingInfoDialog: $showingInfoDialog)
            RecentProjectsSection()
            UserProjectsSection()
            SnacksSection()
          }
          .padding()
        }
        .refreshable {
          await viewModel.refresh()
        }
      }
      .background(Color(.systemGroupedBackground))
      .sheet(item: $selectedProject) { project in
        ProjectDetailsView(project: project)
      }
      
      DevServerInfoModal(showingInfoDialog: $showingInfoDialog)
    }
  }
}

struct HomeView_Previews: PreviewProvider {
  static var previews: some View {
    HomeView()
      .environmentObject(HomeViewModel())
  }
}

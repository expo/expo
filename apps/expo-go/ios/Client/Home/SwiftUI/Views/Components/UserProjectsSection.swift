import SwiftUI

struct UserProjectsSection: View {
  @State private var userProjects: [Project] = []
  @State private var isLoading = false
  @EnvironmentObject var viewModel: HomeViewModel
  
  var body: some View {
    VStack(alignment: .leading, spacing: 20) {
      Text("Projects")
        .font(.caption)
        .fontWeight(.semibold)

      if isLoading {
        HStack {
          ProgressView()
            .scaleEffect(0.8)
          Text("Loading projects...")
            .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      } else if userProjects.isEmpty {
        EmptyStateView(
          icon: "folder",
          title: "No projects found",
          description: "Sign in to view your published projects"
        )
      } else {
        VStack(spacing: 0) {
          ForEach(userProjects) { project in
            ProjectRow(project: project) {
              viewModel.openProject(url: project.manifestUrl ?? "")
            }
            Divider()
          }
          if userProjects.count > 3 {
            NavigationLink(destination: ProjectListView(projects: userProjects)) {
              HStack {
                Text("See all projects")
                  .foregroundColor(.primary)
                Spacer()
                Image(systemName: "chevron.right")
                  .font(.caption)
                  .foregroundColor(.secondary)
              }
              .padding()
            }
            .buttonStyle(PlainButtonStyle())
          }
        }
        .cardStyle()
      }
    }
    .task {
      await loadUserProjects()
    }
  }
  
  private func loadUserProjects() async {
    isLoading = true
    
    // TODO: Implement actual GraphQL query
    try? await Task.sleep(nanoseconds: 1_000_000_000)
    
    userProjects = Project.mockList
    isLoading = false
  }
}

struct UserProjectsSection_Previews: PreviewProvider {
  static var previews: some View {
    List {
      UserProjectsSection()
    }
    .environmentObject(HomeViewModel())
  }
}

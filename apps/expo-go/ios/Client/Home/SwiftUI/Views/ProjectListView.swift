import SwiftUI

struct ProjectListView: View {
  let projects: [Project]
  @EnvironmentObject var viewModel: HomeViewModel
  
  var body: some View {
    ScrollView {
      VStack {
        VStack(spacing:0) {
          ForEach(projects) { project in
            ProjectRow(project: project) {
              viewModel.openProject(url: project.manifestUrl ?? "")
            }
          }
        }
        .cardStyle()
        
        Spacer()
      }
      .padding()
    }
    .background(Color(.systemGroupedBackground))
    .navigationTitle("Projects")
    .navigationBarTitleDisplayMode(.inline)
  }
}

struct ProjectListView_Previews: PreviewProvider {
  static var previews: some View {
    NavigationView {
      ProjectListView(projects: Project.mockList)
    }
    .environmentObject(HomeViewModel())
  }
}

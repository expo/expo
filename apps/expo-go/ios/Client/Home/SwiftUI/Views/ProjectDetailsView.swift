import SwiftUI

struct ProjectDetailsView: View {
  let project: Project
  @Environment(\.dismiss) private var dismiss
  
  var body: some View {
    NavigationView {
      ScrollView {
        VStack(alignment: .leading, spacing: 20) {
          HStack {
            AsyncImage(url: URL(string: project.iconUrl ?? "")) { image in
              image
                .resizable()
                .aspectRatio(contentMode: .fit)
            } placeholder: {
              RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.3))
                .overlay(
                  Image(systemName: "app.fill")
                    .foregroundColor(.gray)
                )
            }
            .frame(width: 60, height: 60)
            .cornerRadius(12)
            
            VStack(alignment: .leading, spacing: 4) {
              Text(project.name)
                .font(.title2)
                .fontWeight(.semibold)
              
              Text(project.fullName)
                .font(.body)
                .foregroundColor(.secondary)
            }
            
            Spacer()
          }
          
          // Description
          if let description = project.description {
            Text(description)
              .font(.body)
          }
          
          // Project Details
          VStack(alignment: .leading, spacing: 12) {
            DetailRow(title: "Package Name", value: project.packageName ?? "N/A")
            DetailRow(title: "Runtime Version", value: project.runtimeVersion ?? "N/A")
            DetailRow(title: "Platform", value: project.platform ?? "N/A")
            DetailRow(title: "Last Updated", value: project.lastUpdated ?? "N/A")
          }
          
          // Actions
          VStack(spacing: 12) {
            Button("Open Project") {
              // TODO: Handle project opening
            }
            .buttonStyle(.borderedProminent)
            .frame(maxWidth: .infinity)
            
            Button("View Branches") {
              // TODO: Navigate to branches
            }
            .buttonStyle(.bordered)
            .frame(maxWidth: .infinity)
          }
          
          Spacer()
        }
        .padding()
      }
      .navigationTitle("Project Details")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .navigationBarTrailing) {
          Button("Done") {
            dismiss()
          }
        }
      }
    }
  }
}

struct DetailRow: View {
  let title: String
  let value: String
  
  var body: some View {
    HStack {
      Text(title)
        .fontWeight(.medium)
      Spacer()
      Text(value)
        .foregroundColor(.secondary)
    }
  }
}

struct ProjectDetailsView_Previews: PreviewProvider {
  static var previews: some View {
    ProjectDetailsView(project: Project.mock)
  }
}

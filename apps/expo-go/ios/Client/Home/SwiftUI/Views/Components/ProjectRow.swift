import SwiftUI

struct ProjectRow: View {
  let project: Project
  let onTap: () -> Void
  
  var body: some View {
    Button {
      onTap()
    } label: {
      HStack(alignment: .center) {
        VStack(alignment: .leading) {
          Text(project.name)
            .font(.headline)
            .foregroundColor(.primary)
          Text(project.manifestUrl ?? project.fullName)
            .font(.caption)
            .foregroundColor(.secondary)
            .lineLimit(1)
        }
        
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

struct ProjectRow_Previews: PreviewProvider {
  static var previews: some View {
    List {
      ProjectRow(project: Project.mock) {
        // Preview action
      }
    }
  }
}

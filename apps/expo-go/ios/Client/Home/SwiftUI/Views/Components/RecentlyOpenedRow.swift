import SwiftUI

struct RecentlyOpenedRow: View {
  let project: Project
  let onTap: () -> Void
  
  var body: some View {
    Button {
      onTap()
    } label: {
      HStack(alignment: .center) {
        Text(project.name)
          .font(.headline)
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

struct RecentlyOpenedRow_Previews: PreviewProvider {
  static var previews: some View {
    List {
      RecentlyOpenedRow(project: Project.mock) {
      }
    }
  }
}

import SwiftUI

struct EmptyStateView: View {
  let icon: String
  let title: String
  let description: String
  
  var body: some View {
    VStack(spacing: 16) {
      Image(systemName: icon)
        .font(.system(size: 48))
        .foregroundColor(.gray)
      
      VStack(spacing: 8) {
        Text(title)
          .font(.headline)
          .fontWeight(.medium)
        
        Text(description)
          .font(.body)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 40)
  }
}

struct EmptyStateView_Previews: PreviewProvider {
  static var previews: some View {
    EmptyStateView(
      icon: "folder",
      title: "No projects found",
      description: "Sign in to view your published projects"
    )
  }
}

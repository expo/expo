import SwiftUI

struct SnacksSection: View {
  @State private var snacks: [Snack] = []
  @State private var isLoading = false
  
  var body: some View {
    VStack(alignment: .leading, spacing: 20) {
      Text("Snacks")
        .font(.caption2)
        .fontWeight(.semibold)
      if isLoading {
        HStack {
          ProgressView()
            .scaleEffect(0.8)
          Text("Loading Snacks...")
            .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      } else if snacks.isEmpty {
        EmptyStateView(
          icon: "play.rectangle",
          title: "No Snacks found",
          description: "Sign in to view your Snacks from snack.expo.dev"
        )
      } else {
        VStack(spacing: 0) {
          ForEach(snacks) { snack in
            SnackRow(snack: snack) {
              // TODO: Handle snack tap
            }
            Divider()
          }
          if snacks.count > 3 {
            NavigationLink(destination: SnackListView(snacks: snacks)) {
              HStack {
                Text("See all snacks")
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
      await loadSnacks()
    }
  }
  
  private func loadSnacks() async {
    isLoading = true
    
    try? await Task.sleep(nanoseconds: 1_000_000_000)
    
    snacks = Snack.mockList
    isLoading = false
  }
}

struct SnackRow: View {
  let snack: Snack
  let onTap: () -> Void
  
  var body: some View {
    Button {
      onTap()
    } label: {
      HStack(alignment: .firstTextBaseline) {
        VStack(alignment: .leading) {
          Text(snack.name)
            .font(.headline)
            .foregroundColor(.primary)
          if let description = snack.description {
            Text(description)
              .font(.caption)
              .foregroundColor(.secondary)
              .lineLimit(1)
          }
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

struct SnacksSection_Previews: PreviewProvider {
  static var previews: some View {
    List {
      SnacksSection()
    }
  }
}

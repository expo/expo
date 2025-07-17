import SwiftUI

struct SnackListView: View {
  let snacks: [Snack]
  @State private var searchText = ""
  
  var filteredSnacks: [Snack] {
    if searchText.isEmpty {
      return snacks
    } else {
      return snacks.filter { snack in
        snack.name.localizedCaseInsensitiveContains(searchText)
      }
    }
  }
  
  var body: some View {
    List {
      ForEach(filteredSnacks) { snack in
        SnackRow(snack: snack) {
          
        }
      }
    }
    .navigationTitle("Snacks")
    .navigationBarTitleDisplayMode(.large)
    .searchable(text: $searchText, prompt: "Search Snacks")
  }
}

struct SnackListView_Previews: PreviewProvider {
  static var previews: some View {
    NavigationView {
      SnackListView(snacks: Snack.mockList)
    }
  }
}

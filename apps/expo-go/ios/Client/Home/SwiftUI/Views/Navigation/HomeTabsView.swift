import SwiftUI

struct HomeTabsView: View {
  @State private var selectedTab = 0
  @EnvironmentObject var viewModel: HomeViewModel
  
  var body: some View {
    TabView(selection: $selectedTab) {
      HomeView()
        .tabItem {
          Image(systemName: "house.fill")
          Text("Home")
        }
        .tag(0)
      
      SettingsView()
        .tabItem {
          Image(systemName: "gear")
          Text("Settings")
        }
        .tag(2)
    }
  }
}

struct HomeTabView_Previews: PreviewProvider {
  static var previews: some View {
    HomeTabsView()
      .environmentObject(HomeViewModel())
  }
}

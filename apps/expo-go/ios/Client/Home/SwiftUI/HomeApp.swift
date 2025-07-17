import SwiftUI

struct HomeApp: App {
  var body: some Scene {
    WindowGroup {
      HomeAppRootView(viewModel: HomeViewModel())
    }
  }
}

struct HomeAppRootView: View {
  @ObservedObject var viewModel: HomeViewModel
  @StateObject private var navigation = HomeNavigation()
  
  init(viewModel: HomeViewModel) {
    self.viewModel = viewModel
  }
  
  var body: some View {
    HomeTabsView()
      .navigationBarHidden(true)
      .environmentObject(viewModel)
      .environmentObject(navigation)
      .sheet(isPresented: $navigation.showingUserProfile) {
        AccountModalView()
      }
      .alert("Error", isPresented: $viewModel.showError) {
        Button("OK") {
          viewModel.dismissError()
        }
      } message: {
        Text(viewModel.errorMessage ?? "An error occurred")
      }
  }
}

struct HomeAppRootView_Previews: PreviewProvider {
  static var previews: some View {
    HomeAppRootView(viewModel: HomeViewModel())
  }
}

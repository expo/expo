import SwiftUI
import Combine

private func sanitizeUrlString(_ urlString: String) -> String? {
  var sanitizedUrl = urlString.trimmingCharacters(in: .whitespacesAndNewlines)
  
  if !sanitizedUrl.contains("://") {
    sanitizedUrl = "http://" + sanitizedUrl
  }
  
  guard URL(string: sanitizedUrl) != nil else {
    return nil
  }
  
  return sanitizedUrl
}

struct DevelopmentServersSection: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @Binding var showingInfoDialog: Bool
  @State private var showingURLInput = false
  @State private var urlText = ""
  @State private var cancellables = Set<AnyCancellable>()
  
  var body: some View {
    VStack(alignment: .leading, spacing: 20) {
      header
      
       VStack(alignment: .leading, spacing: 0) {
        if viewModel.devServers.isEmpty {
          Text("No development servers found")
            .foregroundColor(.primary)
            .multilineTextAlignment(.leading)
            .padding()
          Divider()
        } else {
          ForEach(viewModel.devServers, id: \.url) { server in
            DevServerRow(server: server) {
              viewModel.openProject(url: server.url)
            }
            Divider()
          }
        }
        
        enterUrl
      }
      .cardStyle()
    }
    .onAppear {
      startServerDiscovery()
    }
    .onDisappear {
      cancellables.removeAll()
    }
  }
  
  private var enterUrl: some View {
    VStack(spacing: 20) {
      Button {
        withAnimation(.easeInOut(duration: 0.3)) {
          showingURLInput.toggle()
        }
      } label: {
        HStack {
          Image(systemName: showingURLInput ? "chevron.down" : "chevron.right")
            .font(.caption)
            .foregroundColor(.secondary)
          
          Text("Enter URL manually")
            .foregroundColor(.primary)
          Spacer()
        }
      }
      
      if showingURLInput {
        TextField("http://10.0.0.25:8081", text: $urlText)
          .autocapitalization(.none)
          .disableAutocorrection(true)
          .padding(.horizontal, 16)
          .padding(.vertical, 12)
          .overlay(
            RoundedRectangle(cornerRadius: 5)
              .stroke(Color(.systemGray4), lineWidth: 1)
          )
          .clipShape(RoundedRectangle(cornerRadius: 5))
        
        connectButton
      }
    }
    .animation(.easeInOut, value: showingURLInput)
    .padding()
  }
  
  private var header: some View {
    HStack {
      Image("terminal-icon")
        .resizable()
        .frame(width: 16, height: 16)

      Text("Development servers")
        .font(.caption)
        .fontWeight(.semibold)
      
      Spacer()
      
      Button {
        showingInfoDialog = true
      } label: {
        Text("HELP")
          .font(.caption)
      }
    }
  }
  
  private var connectButton: some View {
    Button {
      if !urlText.isEmpty {
        let sanitizedURL = sanitizeUrlString(urlText)
        if let validURL = sanitizedURL {
          viewModel.openProject(url: validURL)
          withAnimation(.easeInOut(duration: 0.3)) {
            showingURLInput = false
          }
          urlText = ""
        }
      }
    } label: {
      Text("Connect")
        .font(.headline)
        .foregroundColor(.white)
        .frame(maxWidth: .infinity)
        .padding()
        .background(urlText.isEmpty ? Color.gray : Color.black)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
    .disabled(urlText.isEmpty)
    .buttonStyle(PlainButtonStyle())
  }
  
  private func startServerDiscovery() {
    Timer.publish(every: 2.0, on: .main, in: .common)
      .autoconnect()
      .receive(on: DispatchQueue.global(qos: .background))
      .sink { [weak viewModel] _ in
        Task { @MainActor in
          await viewModel?.discoverDevServers()
        }
      }
      .store(in: &cancellables)
  }
}

struct DevServerRow: View {
  let server: DevServer
  let onTap: () -> Void
  
  var body: some View {
    Button {
      onTap()
    }
    label: {
      HStack {
        Circle()
          .fill(Color.green)
          .frame(width: 15, height: 15)
        
        Text(server.description)
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

struct DevelopmentServersSection_Previews: PreviewProvider {
  static var previews: some View {
    VStack {
      DevelopmentServersSection(showingInfoDialog: .constant(false))
    }
    .environmentObject(HomeViewModel())
  }
}

// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct SourceMapExplorerView: View {
  @StateObject private var viewModel = SourceMapExplorerViewModel()

  var body: some View {
    Group {
      switch viewModel.loadingState {
      case .idle, .loading:
        loadingView
      case .loaded:
        FolderListView(
          title: "Source Map",
          nodes: viewModel.filteredFileTree,
          sourceMap: viewModel.sourceMap,
          stats: viewModel.sourceMapStats
        )
        .searchable(text: $viewModel.searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search files")
      case .error(let error):
        errorView(error)
      }
    }
    .navigationTitle("Source Map Explorer")
    .navigationBarTitleDisplayMode(.inline)
    .task {
      await viewModel.loadSourceMap()
    }
  }

  private var loadingView: some View {
    VStack(spacing: 12) {
      ProgressView()
      Text("Loading source map...")
        .font(.subheadline)
        .foregroundColor(.secondary)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }

  private func errorView(_ error: SourceMapError) -> some View {
    VStack(spacing: 16) {
      Image(systemName: "exclamationmark.triangle")
        .font(.system(size: 40))
        .foregroundColor(.orange)

      Text("Failed to load source map")
        .font(.headline)

      Text(error.errorDescription ?? "Unknown error")
        .font(.subheadline)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)

      Button("Retry") {
        Task { await viewModel.loadSourceMap() }
      }
      .buttonStyle(.borderedProminent)
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}

struct FolderListView: View {
  let title: String
  let nodes: [FileTreeNode]
  let sourceMap: SourceMap?
  let stats: (files: Int, totalSize: String)?

  var body: some View {
    List {
      if let stats = stats {
        Section {
          HStack {
            Label("\(stats.files) files", systemImage: "doc.on.doc")
            Spacer()
            Label(stats.totalSize, systemImage: "internaldrive")
          }
          .font(.caption)
          .foregroundColor(.secondary)
        }
      }

      Section {
        ForEach(nodes) { node in
          if node.isDirectory {
            NavigationLink(destination: FolderListView(
              title: node.name,
              nodes: node.children,
              sourceMap: sourceMap,
              stats: nil
            )) {
              FileRow(node: node)
            }
          } else {
            NavigationLink(destination: CodeFileView(node: node, sourceMap: sourceMap)) {
              FileRow(node: node)
            }
          }
        }
      }
    }
    .listStyle(.insetGrouped)
    .navigationTitle(title)
    .navigationBarTitleDisplayMode(.inline)
  }
}

struct FileRow: View {
  let node: FileTreeNode

  var body: some View {
    Label {
      Text(node.name)
        .lineLimit(1)
    } icon: {
      Image(systemName: node.isDirectory ? "folder.fill" : fileIcon)
        .foregroundColor(node.isDirectory ? .blue : iconColor)
    }
  }

  private var fileIcon: String {
    let ext = (node.name as NSString).pathExtension.lowercased()
    switch ext {
    case "ts", "tsx": return "swift"
    case "js", "jsx": return "curlybraces"
    case "json": return "doc.text"
    case "css", "scss", "sass": return "paintbrush"
    case "png", "jpg", "jpeg", "gif", "svg": return "photo"
    case "md", "txt": return "doc.plaintext"
    default: return "doc"
    }
  }

  private var iconColor: Color {
    let ext = (node.name as NSString).pathExtension.lowercased()
    switch ext {
    case "ts", "tsx": return .blue
    case "js", "jsx": return .yellow
    case "json": return .orange
    case "css", "scss", "sass": return .pink
    default: return .secondary
    }
  }
}

struct CodeFileView: View {
  let node: FileTreeNode
  let sourceMap: SourceMap?

  private var content: String? {
    guard let contentIndex = node.contentIndex,
          let sourceMap = sourceMap,
          let sourcesContent = sourceMap.sourcesContent,
          contentIndex < sourcesContent.count else {
      return nil
    }
    return sourcesContent[contentIndex]
  }

  private var lines: [String] {
    (content ?? "").components(separatedBy: "\n")
  }

  var body: some View {
    ScrollView([.horizontal, .vertical]) {
      HStack(alignment: .top, spacing: 0) {
        lineNumbers
        codeContent
      }
    }
    .navigationTitle(node.name)
    .navigationBarTitleDisplayMode(.inline)
  }

  private var lineNumbers: some View {
    VStack(alignment: .trailing, spacing: 0) {
      ForEach(Array(lines.enumerated()), id: \.offset) { index, _ in
        Text("\(index + 1)")
          .font(.system(size: 12, design: .monospaced))
          .foregroundColor(.secondary)
          .frame(minWidth: 32, alignment: .trailing)
      }
    }
    .padding(.leading, 8)
    .padding(.trailing, 8)
    .background(Color.expoSecondarySystemBackground)
  }

  private var codeContent: some View {
    VStack(alignment: .leading, spacing: 0) {
      ForEach(Array(lines.enumerated()), id: \.offset) { _, line in
        Text(line.isEmpty ? " " : line)
          .font(.system(size: 12, design: .monospaced))
          .foregroundColor(.primary)
      }
    }
    .padding(.horizontal, 8)
  }
}

#Preview {
  NavigationView {
    SourceMapExplorerView()
  }
}

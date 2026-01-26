// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct SourceMapExplorerView: View {
  @StateObject private var viewModel = SourceMapExplorerViewModel()

  private var isSearching: Bool {
    !viewModel.searchText.isEmpty
  }

  var body: some View {
    Group {
      switch viewModel.loadingState {
      case .idle, .loading:
        loadingView
      case .loaded:
        FolderListView(
          title: "Source Code Explorer",
          nodes: viewModel.filteredFileTree,
          sourceMap: viewModel.sourceMap,
          stats: viewModel.sourceMapStats,
          isSearching: isSearching
        )
      case .error(let error):
        errorView(error)
      }
    }
    .navigationTitle("Source Code Explorer")
#if !os(macOS)
    .navigationBarTitleDisplayMode(.inline)
#endif
    .searchable(text: $viewModel.searchText, placement: .automatic, prompt: "Search files")
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
  let isSearching: Bool

  var body: some View {
    List {
      if nodes.isEmpty {
        Text(isSearching ? "No files found" : "Empty folder")
          .foregroundColor(.secondary)
      } else {
        ForEach(nodes) { node in
          if node.isDirectory {
            NavigationLink(destination: FolderListView(
              title: node.name,
              nodes: node.children,
              sourceMap: sourceMap,
              stats: nil,
              isSearching: false
            )) {
              FileRow(node: node, showPath: isSearching)
            }
          } else {
            NavigationLink(destination: CodeFileView(node: node, sourceMap: sourceMap)) {
              FileRow(node: node, showPath: isSearching)
            }
          }
        }
      }
    }
#if !os(macOS)
    .listStyle(.insetGrouped)
#endif
    .navigationTitle(isSearching ? "Search Results" : title)
#if !os(macOS)
    .navigationBarTitleDisplayMode(.inline)
    .toolbar {
      ToolbarItem(placement: .navigationBarTrailing) {
        if let stats = stats {
          Menu {
            Label("\(stats.files) files", systemImage: "doc.on.doc")
            Label(stats.totalSize, systemImage: "internaldrive")
          } label: {
            Image(systemName: "info.circle")
          }
        }
      }
    }
#endif
  }
}

struct FileRow: View {
  let node: FileTreeNode
  var showPath: Bool = false

  private var parentDirectory: String? {
    let path = node.path
    guard let lastSlash = path.lastIndex(of: "/") else { return nil }
    let parent = String(path[..<lastSlash])
    return parent.isEmpty ? nil : parent
  }

  var body: some View {
    Label {
      VStack(alignment: .leading, spacing: 2) {
        Text(node.name)
          .lineLimit(1)
        if showPath, let parent = parentDirectory {
          Text(parent)
            .font(.caption)
            .foregroundColor(.secondary)
            .lineLimit(1)
        }
      }
    } icon: {
      Image(systemName: node.isDirectory ? "folder.fill" : fileIcon)
        .foregroundColor(node.isDirectory ? .blue : iconColor)
    }
  }

  private var fileIcon: String {
    let ext = (node.name as NSString).pathExtension.lowercased()
    switch ext {
    case "ts", "tsx", "js", "jsx": return "curlybraces"
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
  @Environment(\.colorScheme) private var colorScheme
  @State private var highlightedLines: [AttributedString]?

  private var content: String {
    guard let contentIndex = node.contentIndex,
          let sourceMap,
          let sourcesContent = sourceMap.sourcesContent,
          contentIndex < sourcesContent.count,
          let code = sourcesContent[contentIndex] else {
      return "// Content not available"
    }
    return code
  }

  private var lines: [String] {
    content.components(separatedBy: "\n")
  }

  private var theme: SyntaxHighlighter.Theme {
    colorScheme == .dark ? .dark : .light
  }

  private var lineNumberWidth: CGFloat {
    let digits = String(lines.count).count
    return CGFloat(digits * 10 + 16)
  }

  var body: some View {
    GeometryReader { geometry in
      ScrollView(.vertical) {
        ScrollView(.horizontal, showsIndicators: false) {
          HStack(alignment: .top, spacing: 0) {
            LineNumbersColumn(lines: lines, theme: theme, lineNumberWidth: lineNumberWidth)
            CodeColumn(lines: lines, highlightedLines: highlightedLines, theme: theme)
          }
          .frame(minWidth: geometry.size.width, alignment: .leading)
        }
      }
    }
    .background(theme.background)
    .navigationTitle(node.name)
#if !os(macOS)
    .navigationBarTitleDisplayMode(.inline)
#endif
    .task(id: colorScheme) {
      highlightedLines = await SyntaxHighlighter.highlightLines(lines, theme: theme)
    }
  }
}

struct LineNumbersColumn: View {
  let lines: [String]
  let theme: SyntaxHighlighter.Theme
  let lineNumberWidth: CGFloat
  
  var body: some View {
    LazyVStack(alignment: .trailing, spacing: 0) {
      ForEach(0..<lines.count, id: \.self) { index in
        Text("\(index + 1)")
          .font(.system(size: 13, weight: .regular, design: .monospaced))
          .foregroundColor(theme.lineNumber)
          .frame(height: 20)
      }
    }
    .frame(width: lineNumberWidth)
    .padding(.vertical, 12)
    .background(theme.background.opacity(0.8))
  }
}

struct CodeColumn: View {
  let lines: [String]
  let highlightedLines: [AttributedString]?
  let theme: SyntaxHighlighter.Theme
  
  var body: some View {
    LazyVStack(alignment: .leading, spacing: 0) {
      ForEach(0..<lines.count, id: \.self) { index in
        if let highlightedLines, index < highlightedLines.count {
          Text(highlightedLines[index])
            .font(.system(size: 13, weight: .regular, design: .monospaced))
            .frame(height: 20, alignment: .leading)
        } else {
          Text(lines[index].isEmpty ? " " : lines[index])
            .font(.system(size: 13, weight: .regular, design: .monospaced))
            .foregroundColor(theme.plain)
            .frame(height: 20, alignment: .leading)
        }
      }
    }
    .padding(.vertical, 12)
    .padding(.trailing, 16)
  }
}

#Preview {
  NavigationView {
    SourceMapExplorerView()
  }
}

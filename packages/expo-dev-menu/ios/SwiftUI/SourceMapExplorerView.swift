// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

// MARK: - Platform-Specific View Extensions

private extension View {
  /// Safely applies navigation bar title display mode where supported
  @ViewBuilder
  func applyNavigationDisplayModeInline() -> some View {
    #if os(iOS) || os(watchOS)
    self.navigationBarTitleDisplayMode(.inline)
    #else
    self
    #endif
  }
  
  /// Applies appropriate list style based on platform without type erasure
  @ViewBuilder
  func applyCompatibleListStyle() -> some View {
    #if os(iOS)
    self.listStyle(.insetGrouped)
    #elseif os(tvOS)
    self.listStyle(.plain)
    #else
    self.listStyle(.automatic)
    #endif
  }
}

/// Platform-compatible Menu view builder for stats display
@ViewBuilder
private func statsMenu(files: Int, totalSize: String) -> some View {
  #if os(tvOS)
  if #available(tvOS 17.0, *) {
    menuContent(files: files, totalSize: totalSize)
  }
  #else
  menuContent(files: files, totalSize: totalSize)
  #endif
}

@ViewBuilder
private func menuContent(files: Int, totalSize: String) -> some View {
  Menu {
    Label("\(files) files", systemImage: "doc.on.doc")
    Label(totalSize, systemImage: "internaldrive")
  } label: {
    Image(systemName: "info.circle")
  }
}

// MARK: - Views

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
    .applyNavigationDisplayModeInline()
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
      #if !os(tvOS)
      .buttonStyle(.borderedProminent)
      #endif
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
          NavigationLink(destination: destinationView(for: node)) {
            FileRow(node: node, showPath: isSearching)
          }
        }
      }
    }
    .applyCompatibleListStyle()
    .navigationTitle(isSearching ? "Search Results" : title)
    .applyNavigationDisplayModeInline()
    .toolbar {
      // Using .primaryAction or .automatic works better for cross-platform
      ToolbarItem(placement: .automatic) {
        if let stats = stats {
          statsMenu(files: stats.files, totalSize: stats.totalSize)
        }
      }
    }
  }

  @ViewBuilder
  private func destinationView(for node: FileTreeNode) -> some View {
    if node.isDirectory {
      FolderListView(
        title: node.name,
        nodes: node.children,
        sourceMap: sourceMap,
        stats: nil,
        isSearching: false
      )
    } else {
      CodeFileView(node: node, sourceMap: sourceMap)
    }
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
    .applyNavigationDisplayModeInline()
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
// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

#if os(macOS)
private let toolbarPlacement: ToolbarItemPlacement = .automatic
#elseif os(tvOS)
private let toolbarPlacement: ToolbarItemPlacement = .automatic
#else
private let toolbarPlacement: ToolbarItemPlacement = .navigationBarTrailing
#endif

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
    .inlineNavigationBar()
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
    .defaultListStyle()
    .navigationTitle(isSearching ? "Search Results" : title)
    .inlineNavigationBar()
    .toolbar {
      ToolbarItem(placement: toolbarPlacement) {
        if let stats = stats {
          statsMenu(stats)
        }
      }
    }
  }

  @ViewBuilder
  private func statsMenu(_ stats: (files: Int, totalSize: String)) -> some View {
    #if os(tvOS)
    if #available(tvOS 17.0, *) {
      Menu {
        Label("\(stats.files) files", systemImage: "doc.on.doc")
        Label(stats.totalSize, systemImage: "internaldrive")
      } label: {
        Image(systemName: "info.circle")
      }
    }
    #else
    Menu {
      Label("\(stats.files) files", systemImage: "doc.on.doc")
      Label(stats.totalSize, systemImage: "internaldrive")
    } label: {
      Image(systemName: "info.circle")
    }
    #endif
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
  @State private var isEditing = false
  @State private var displayContent: String = ""

  private var originalContent: String {
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
    displayContent.components(separatedBy: "\n")
  }

  private var theme: SyntaxHighlighter.Theme {
    colorScheme == .dark ? .dark : .light
  }

  private var lineNumberWidth: CGFloat {
    let digits = String(lines.count).count
    return CGFloat(digits * 10 + 16)
  }

  var body: some View {
    Group {
      if isEditing {
        editingView()
      } else {
        readOnlyView()
      }
    }
    .background(theme.background)
    .navigationTitle(node.name)
    .inlineNavigationBar()
    .toolbar {
      ToolbarItem(placement: toolbarPlacement) {
        Button(isEditing ? "Done" : "Edit") {
          if isEditing {
            isEditing = false
            Task {
              highlightedLines = await SyntaxHighlighter.highlightLines(lines, theme: theme)
            }
          } else {
            isEditing = true
          }
        }
      }
    }
    .onAppear {
      if displayContent.isEmpty {
        displayContent = originalContent
      }
    }
    .task(id: colorScheme) {
      highlightedLines = await SyntaxHighlighter.highlightLines(lines, theme: theme)
    }
  }

  private func readOnlyView() -> some View {
    ScrollView(.vertical) {
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(alignment: .top, spacing: 0) {
          LineNumbersColumn(lines: lines, theme: theme, lineNumberWidth: lineNumberWidth)
          CodeColumn(lines: lines, highlightedLines: highlightedLines, theme: theme)
        }
      }
    }
  }

  private func editingView() -> some View {
    TextEditor(text: $displayContent)
      .font(.system(size: 13, weight: .regular, design: .monospaced))
      #if os(iOS) || os(tvOS)
      .textInputAutocapitalization(.never)
      #endif
      .autocorrectionDisabled()
      .modifier(ScrollContentBackgroundModifier())
      .background(theme.background)
      .foregroundColor(theme.plain)
  }
}

private struct ScrollContentBackgroundModifier: ViewModifier {
  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      content.scrollContentBackground(.hidden)
    } else {
      content
    }
  }
}

struct LineNumbersColumn: View {
  let lines: [String]
  let theme: SyntaxHighlighter.Theme
  let lineNumberWidth: CGFloat

  var body: some View {
    VStack(alignment: .trailing, spacing: 0) {
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
    VStack(alignment: .leading, spacing: 0) {
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
    .fixedSize(horizontal: true, vertical: false)
    .padding(.vertical, 12)
    .padding(.trailing, 16)
  }
}

private extension View {
  @ViewBuilder
  func inlineNavigationBar() -> some View {
    #if os(iOS)
    self.navigationBarTitleDisplayMode(.inline)
    #else
    self
    #endif
  }

  @ViewBuilder
  func defaultListStyle() -> some View {
    #if os(iOS)
    self.listStyle(.insetGrouped)
    #elseif os(tvOS)
    self.listStyle(.plain)
    #else
    self
    #endif
  }
}

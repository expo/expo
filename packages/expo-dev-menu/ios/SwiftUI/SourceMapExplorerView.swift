// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

#if os(iOS)
private let toolbarPlacement: ToolbarItemPlacement = .navigationBarTrailing
#else
private let toolbarPlacement: ToolbarItemPlacement = .automatic
#endif

struct SourceMapExplorerView: View {
  @StateObject private var viewModel = SourceMapExplorerViewModel()
  @State private var showNavigationBar = false
  @State private var showContent = false

  private var isSearching: Bool {
    !viewModel.searchText.isEmpty
  }

  private var isLoading: Bool {
    switch viewModel.loadingState {
    case .idle, .loading:
      return true
    case .loaded, .error:
      return false
    }
  }

  var body: some View {
    contentView
      .task {
        await viewModel.loadSourceMap()
        // Show nav bar first
        showNavigationBar = true
        // Wait for layout to settle, then fade in content
        DispatchQueue.main.async {
          withAnimation(.easeOut(duration: 0.2)) {
            showContent = true
          }
        }
      }
  }

  @ViewBuilder
  private var contentView: some View {
    ZStack {
      // Content layer
      switch viewModel.loadingState {
      case .idle, .loading:
        Color.clear
      case .loaded:
        loadedView
          .opacity(showContent ? 1 : 0)
          .animation(.easeOut(duration: 0.2), value: showContent)
      case .error(let error):
        errorView(error)
          .opacity(showContent ? 1 : 0)
          .animation(.easeOut(duration: 0.2), value: showContent)
      }

      // Loading overlay - fades out when showContent becomes true
      loadingView
        .opacity(showContent ? 0 : 1)
        .animation(.easeOut(duration: 0.2).delay(0.2), value: showContent)
        .allowsHitTesting(!showContent)
    }
    .navigationTitle(showNavigationBar ? "Source code explorer" : "")
    .inlineNavigationBar()
#if !os(macOS)
    .navigationBarHidden(!showNavigationBar)
#endif
    .modifier(ConditionalSearchable(isEnabled: showContent, text: $viewModel.searchText))
  }

  private var loadedView: some View {
    FolderListView(
      title: "Source code explorer",
      nodes: isSearching ? viewModel.filteredFileTree : viewModel.fileTree,
      sourceMap: viewModel.sourceMap,
      isSearching: isSearching
    )
  }

  private var loadingView: some View {
    VStack(spacing: 12) {
      ProgressView()
      Text("Loading source code...")
        .font(.subheadline)
        .foregroundColor(.secondary)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    #if os(tvOS)
    .background(Color(uiColor: .systemGray))
    #elseif os(macOS)
    .background(Color(uiColor: .windowBackgroundColor))
    #else
    .background(Color(uiColor: .systemGroupedBackground))
    #endif
    .ignoresSafeArea()
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

private struct ConditionalSearchable: ViewModifier {
  let isEnabled: Bool
  @Binding var text: String

  func body(content: Content) -> some View {
    if isEnabled {
      content.searchable(text: $text, placement: .automatic, prompt: "Search files")
    } else {
      content
    }
  }
}

struct FolderListView: View {
  let title: String
  let nodes: [FileTreeNode]
  let sourceMap: SourceMap?
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
  }

  @ViewBuilder
  private func destinationView(for node: FileTreeNode) -> some View {
    if node.isDirectory {
      FolderListView(
        title: node.name,
        nodes: node.children,
        sourceMap: sourceMap,
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
  @State private var showCopiedConfirmation = false
  @State private var wrapLines = false
  @State private var fontSize: CGFloat = 12

  private var isImageFile: Bool {
    let ext = (node.name as NSString).pathExtension.lowercased()
    return ["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp"].contains(ext)
  }

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
    let charWidth = fontSize * 0.6
    return CGFloat(digits) * charWidth + 16
  }

  private var codeToolbar: some View {
    HStack(spacing: 0) {
      #if os(tvOS)
      Spacer()
      #else
      // Copy button
      Button {
        UIPasteboard.general.string = displayContent
        showCopiedConfirmation = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
          showCopiedConfirmation = false
        }
      } label: {
        Label("Copy", systemImage: "doc.on.doc")
          .font(.system(size: 14))
          .frame(maxWidth: .infinity)
      }
      #endif

      Divider().frame(height: 24)

      // Wrap lines button
      Button {
        wrapLines.toggle()
      } label: {
        Label(wrapLines ? "Unwrap" : "Wrap", systemImage: wrapLines ? "arrow.left.and.right.text.vertical" : "text.justify.leading")
          .font(.system(size: 14))
          .frame(maxWidth: .infinity)
      }

      Divider().frame(height: 24)

      // Font size decrease
      Button {
        if fontSize > 8 {
          fontSize -= 1
        }
      } label: {
        HStack(spacing: 2) {
          Image(systemName: "minus")
            .font(.system(size: 10, weight: .bold))
          Text("A")
            .font(.system(size: 16, weight: .medium))
        }
        .frame(maxWidth: .infinity)
      }

      Divider().frame(height: 24)

      // Font size increase
      Button {
        if fontSize < 24 {
          fontSize += 1
        }
      } label: {
        HStack(spacing: 2) {
          Image(systemName: "plus")
            .font(.system(size: 10, weight: .bold))
          Text("A")
            .font(.system(size: 16, weight: .medium))
        }
        .frame(maxWidth: .infinity)
      }
    }
    .foregroundColor(Color(uiColor: .label))
    .padding(.vertical, 10)
    #if os(tvOS)
    .background(Color(uiColor: .systemGray))
    #elseif os(macOS)
    .background(Color(uiColor: .controlBackgroundColor))
    #else
    .background(Color(uiColor: .secondarySystemBackground))
    #endif
  }

  var body: some View {
    VStack(spacing: 0) {
      if !isImageFile {
        codeToolbar
      }

      Group {
        if isImageFile {
          imagePreviewUnavailableView()
        } else if isEditing {
          editingView()
        } else {
          readOnlyView()
        }
      }
    }
    #if os(tvOS)
    .background(theme.background)
    #elseif os(macOS)
    .background(isImageFile ? Color(uiColor: .windowBackgroundColor) : theme.background)
    #else
    .background(isImageFile ? Color(uiColor: .systemGroupedBackground) : theme.background)
    #endif
    .navigationTitle(node.name)
    .inlineNavigationBar()
    .toolbar {
      ToolbarItem(placement: toolbarPlacement) {
        if !isImageFile {
          Button(isEditing ? "Done" : "Edit") {
            if isEditing {
              isEditing = false

              // If content changed and we have an active Snack session, send the update
              if displayContent != originalContent && SourceMapService.hasActiveSnackSession {
                _ = SourceMapService.sendSnackFileUpdate(
                  path: node.path,
                  oldContents: originalContent,
                  newContents: displayContent
                )
              }

              Task {
                highlightedLines = await SyntaxHighlighter.highlightLines(lines, theme: theme)
              }
            } else {
              isEditing = true
            }
          }
        }
      }
    }
    .overlay {
      if showCopiedConfirmation {
        copiedConfirmationView
          .transition(.opacity.combined(with: .scale(scale: 0.9)))
      }
    }
    .animation(.easeOut(duration: 0.2), value: showCopiedConfirmation)
    .onAppear {
      if displayContent.isEmpty {
        displayContent = originalContent
      }
    }
    .task(id: colorScheme) {
      if !isImageFile {
        highlightedLines = await SyntaxHighlighter.highlightLines(lines, theme: theme)
      }
    }
  }

  private func imagePreviewUnavailableView() -> some View {
    VStack(spacing: 12) {
      Image(systemName: "photo")
        .font(.system(size: 40))
        .foregroundColor(.secondary)
      Text("Image preview not available")
        .font(.subheadline)
        .foregroundColor(.secondary)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }

  private var copiedConfirmationView: some View {
    HStack(spacing: 8) {
      Image(systemName: "checkmark")
        .font(.system(size: 14, weight: .semibold))
      Text("Copied")
        .font(.system(size: 16, weight: .medium))
    }
    .foregroundColor(.white)
    .padding(.horizontal, 16)
    .padding(.vertical, 10)
    .background(Color(uiColor: .darkGray))
    .cornerRadius(8)
  }

  private func readOnlyView() -> some View {
    ScrollView(.vertical) {
      if wrapLines {
        HStack(alignment: .top, spacing: 0) {
          LineNumbersColumn(lines: lines, theme: theme, lineNumberWidth: lineNumberWidth, fontSize: fontSize)
          CodeColumn(lines: lines, highlightedLines: highlightedLines, theme: theme, fontSize: fontSize, wrapLines: true)
        }
      } else {
        ScrollView(.horizontal, showsIndicators: false) {
          HStack(alignment: .top, spacing: 0) {
            LineNumbersColumn(lines: lines, theme: theme, lineNumberWidth: lineNumberWidth, fontSize: fontSize)
            CodeColumn(lines: lines, highlightedLines: highlightedLines, theme: theme, fontSize: fontSize, wrapLines: false)
          }
        }
      }
    }
  }

  private func editingView() -> some View {
    #if os(tvOS)
    readOnlyView()
    #else
    TextEditor(text: $displayContent)
      .font(.system(size: fontSize, weight: .regular, design: .monospaced))
      #if os(iOS) || os(tvOS)
      .textInputAutocapitalization(.never)
      #endif
      .autocorrectionDisabled()
      .modifier(ScrollContentBackgroundModifier())
      .background(theme.background)
      .foregroundColor(theme.plain)
    #endif
  }
}

private struct ScrollContentBackgroundModifier: ViewModifier {
  func body(content: Content) -> some View {
    #if os(tvOS)
    content
    #else
    if #available(iOS 16.0, macOS 13.0, *) {
      content.scrollContentBackground(.hidden)
    } else {
      content
    }
    #endif
  }
}

struct LineNumbersColumn: View {
  let lines: [String]
  let theme: SyntaxHighlighter.Theme
  let lineNumberWidth: CGFloat
  var fontSize: CGFloat = 13

  private var lineHeight: CGFloat {
    fontSize * 1.5
  }

  var body: some View {
    VStack(alignment: .trailing, spacing: 0) {
      ForEach(0..<lines.count, id: \.self) { index in
        Text("\(index + 1)")
          .font(.system(size: fontSize, weight: .regular, design: .monospaced))
          .foregroundColor(theme.lineNumber)
          .frame(height: lineHeight)
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
  var fontSize: CGFloat = 13
  var wrapLines: Bool = false

  private var lineHeight: CGFloat {
    fontSize * 1.5
  }

  var body: some View {
    codeContent
      .padding(.vertical, 12)
      .padding(.trailing, 16)
  }

  @ViewBuilder
  private var codeContent: some View {
    let content = VStack(alignment: .leading, spacing: 0) {
      ForEach(0..<lines.count, id: \.self) { index in
        if let highlightedLines, index < highlightedLines.count {
          Text(highlightedLines[index])
            .font(.system(size: fontSize, weight: .regular, design: .monospaced))
            .frame(minHeight: lineHeight, alignment: .leading)
        } else {
          Text(lines[index].isEmpty ? " " : lines[index])
            .font(.system(size: fontSize, weight: .regular, design: .monospaced))
            .foregroundColor(theme.plain)
            .frame(minHeight: lineHeight, alignment: .leading)
        }
      }
    }

    if wrapLines {
      content
    } else {
      content.fixedSize(horizontal: true, vertical: false)
    }
  }
}

private extension View {
  func inlineNavigationBar() -> some View {
    #if os(iOS)
    self.navigationBarTitleDisplayMode(.inline)
    #else
    self
    #endif
  }

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

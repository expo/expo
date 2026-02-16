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
  @AppStorage("EXDevMenuSourceExplorerFontSize") private var fontSize: Double = 12

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
        } else {
          codeView()
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
              finishEditing()
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
    .onDisappear {
      if isEditing {
        finishEditing(rehighlight: false)
      }
    }
    .task(id: colorScheme) {
      if !isImageFile {
        highlightedLines = await SyntaxHighlighter.highlightLines(lines, theme: theme)
      }
    }
  }

  private func finishEditing(rehighlight: Bool = true) {
    isEditing = false

    // If content changed and we have an active Snack session, send the update
    if displayContent != originalContent && SourceMapService.hasActiveSnackSession {
      _ = SourceMapService.sendSnackFileUpdate(
        path: node.path,
        oldContents: originalContent,
        newContents: displayContent
      )
    }

    if rehighlight {
      Task {
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

  private func codeView() -> some View {
    #if os(iOS)
    // Unified UITextView for both read-only and edit modes - guarantees no layout shift
    CodeTextEditor(
      text: $displayContent,
      font: .monospacedSystemFont(ofSize: CGFloat(fontSize), weight: .regular),
      theme: theme,
      isEditable: isEditing
    )
    #else
    // macOS/tvOS fallback
    if isEditing {
      TextEditor(text: $displayContent)
        .font(.system(size: CGFloat(fontSize), weight: .regular, design: .monospaced))
        .autocorrectionDisabled()
        .modifier(ScrollContentBackgroundModifier())
        .background(theme.background)
        .foregroundColor(theme.plain)
    } else {
      ScrollView(.vertical, showsIndicators: false) {
        CodeColumn(lines: lines, highlightedLines: highlightedLines, theme: theme, fontSize: CGFloat(fontSize))
          .padding(.horizontal, 16)
      }
    }
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

struct CodeColumn: View {
  let lines: [String]
  let highlightedLines: [AttributedString]?
  let theme: SyntaxHighlighter.Theme
  var fontSize: CGFloat = 13

  private var lineHeight: CGFloat {
    fontSize * 1.5
  }

  var body: some View {
    codeContent
      .padding(.vertical, 12)
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

    content
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

#if os(iOS)
/// Helper for VSCode-style auto-indentation in JS/TS/JSX
struct IndentationHelper {
  // Two spaces per indent level
  static let indentUnit = "  "

  // VSCode-style patterns for JS/TS/JSX
  // Increase indent if line ends with { [ ( or opening JSX tag (not self-closing)
  private static let increaseIndentPattern = #"^((?!//).)*(\\{[^}"'`]*|\\([^)"'`]*|\\[[^\]"'`]*|<[A-Za-z][A-Za-z0-9]*[^>]*(?<!/)>)\s*$"#

  // Decrease indent if line starts with } ] ) or closing JSX tag
  private static let decreaseIndentPattern = #"^\s*[\}\]\)]|^\s*</"#

  /// Check if a line should trigger increased indent on next line
  static func shouldIncreaseIndent(after line: String) -> Bool {
    line.range(of: increaseIndentPattern, options: .regularExpression) != nil
  }

  /// Check if a line should be dedented
  static func shouldDecreaseIndent(_ line: String) -> Bool {
    line.range(of: decreaseIndentPattern, options: .regularExpression) != nil
  }

  /// Extract leading whitespace from a line
  static func getIndent(of line: String) -> String {
    String(line.prefix(while: { $0 == " " || $0 == "\t" }))
  }

  /// Get the line containing a position in text
  static func getLine(at position: Int, in text: String) -> String {
    let nsText = text as NSString
    guard position >= 0 && position <= nsText.length else { return "" }
    let lineRange = nsText.lineRange(for: NSRange(location: min(position, nsText.length - 1), length: 0))
    return nsText.substring(with: lineRange).trimmingCharacters(in: .newlines)
  }

  /// Calculate indent for a new line after pressing Enter
  static func calculateNewLineIndent(afterPosition position: Int, in text: String) -> String {
    let currentLine = getLine(at: position, in: text)
    let currentIndent = getIndent(of: currentLine)

    if shouldIncreaseIndent(after: currentLine) {
      return currentIndent + indentUnit
    }
    return currentIndent
  }

  /// Calculate indent when typing a closing bracket at line start
  static func calculateDedentedIndent(forClosingBracket bracket: Character, at position: Int, in text: String) -> String? {
    let currentLine = getLine(at: position, in: text)

    // Only dedent if we're at line start (only whitespace before cursor)
    guard currentLine.trimmingCharacters(in: .whitespaces).isEmpty else {
      return nil
    }

    // Find matching opening bracket and use its line's indent
    let openBracket: Character = bracket == "}" ? "{" : (bracket == "]" ? "[" : "(")
    if let matchPos = findMatchingBracket(openBracket, before: position, in: text) {
      return getIndent(of: getLine(at: matchPos, in: text))
    }

    return nil
  }

  /// Find matching opening bracket, accounting for nesting
  private static func findMatchingBracket(_ open: Character, before position: Int, in text: String) -> Int? {
    let close: Character = open == "{" ? "}" : (open == "[" ? "]" : ")")
    var depth = 1
    var i = position - 1
    let chars = Array(text)

    while i >= 0 {
      let char = chars[i]
      if char == close {
        depth += 1
      } else if char == open {
        depth -= 1
        if depth == 0 {
          return i
        }
      }
      i -= 1
    }
    return nil
  }
}

/// A unified code view using UITextView for both read-only and edit modes
/// This guarantees identical layout in both modes (no shift when toggling)
struct CodeTextEditor: UIViewRepresentable {
  @Binding var text: String
  var font: UIFont
  var theme: SyntaxHighlighter.Theme
  var isEditable: Bool

  func makeUIView(context: Context) -> UITextView {
    let textView = UITextView()
    textView.delegate = context.coordinator
    textView.font = font
    textView.backgroundColor = UIColor(theme.background)
    textView.isEditable = isEditable
    textView.isSelectable = true  // Allow selection in both modes
    textView.autocorrectionType = .no
    textView.autocapitalizationType = .none
    textView.smartQuotesType = .no
    textView.smartDashesType = .no
    textView.smartInsertDeleteType = .no
    textView.spellCheckingType = .no
    textView.keyboardType = .asciiCapable
    textView.showsVerticalScrollIndicator = false
    textView.showsHorizontalScrollIndicator = false
    textView.textContainerInset = UIEdgeInsets(top: 12, left: 16, bottom: 12, right: 16)
    textView.textContainer.lineFragmentPadding = 0  // Remove default 5pt padding

    // Initialize coordinator tracking state
    context.coordinator.lastFontSize = font.pointSize

    // Configure line wrapping
    configureWrapping(for: textView)

    // Set initial text and highlighting
    textView.text = text
    applyHighlighting(to: textView)

    // Auto-focus if editable
    if isEditable {
      focusAtStart(textView)
    }

    return textView
  }

  func updateUIView(_ textView: UITextView, context: Context) {
    let wasEditable = textView.isEditable
    let coordinator = context.coordinator
    textView.isEditable = isEditable
    textView.backgroundColor = UIColor(theme.background)

    // Check what changed
    let fontChanged = coordinator.lastFontSize != font.pointSize
    let textChanged = textView.text != text

    // Update tracking
    coordinator.lastFontSize = font.pointSize

    // Update text if needed
    if textChanged {
      textView.text = text
    }

    // Re-apply highlighting if text, font, or wrap changed
    if textChanged || fontChanged {
      let selectedRange = textView.selectedRange
      applyHighlighting(to: textView)
      // Restore cursor position if still valid
      let nsLength = (textView.text as NSString?)?.length ?? 0
      if selectedRange.location + selectedRange.length <= nsLength {
        textView.selectedRange = selectedRange
      }
    }

    // Focus when transitioning from read-only to edit mode
    if isEditable && !wasEditable && !textView.isFirstResponder {
      focusAtStart(textView)
    }

    // Resign first responder when transitioning to read-only
    if !isEditable && textView.isFirstResponder {
      textView.resignFirstResponder()
    }
  }

  private func focusAtStart(_ textView: UITextView) {
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
      // Set position first, then scroll, then focus - this prevents scroll jump
      textView.selectedRange = NSRange(location: 0, length: 0)
      textView.setContentOffset(.zero, animated: false)
      textView.becomeFirstResponder()
    }
  }

  private func configureWrapping(for textView: UITextView) {
    textView.textContainer.lineBreakMode = .byWordWrapping
    textView.textContainer.widthTracksTextView = true
    textView.textContainer.size.height = CGFloat.greatestFiniteMagnitude
  }

  func makeCoordinator() -> Coordinator {
    Coordinator(self)
  }

  /// Apply syntax highlighting using our existing tokenizer
  fileprivate func applyHighlighting(to textView: UITextView) {
    let text = textView.text ?? ""
    let tokens = SyntaxHighlighter.tokenize(text)

    // Match line height with read-only view (fontSize * 1.5)
    let lineHeight = font.pointSize * 1.5
    let paragraphStyle = NSMutableParagraphStyle()
    paragraphStyle.minimumLineHeight = lineHeight
    paragraphStyle.maximumLineHeight = lineHeight
    paragraphStyle.lineBreakMode = .byWordWrapping

    let attributed = NSMutableAttributedString()
    for token in tokens {
      let attrs: [NSAttributedString.Key: Any] = [
        .foregroundColor: UIColor(token.type.color(in: theme)),
        .font: font,
        .paragraphStyle: paragraphStyle
      ]
      attributed.append(NSAttributedString(string: token.text, attributes: attrs))
    }

    // Preserve selection
    let selectedRange = textView.selectedRange
    textView.attributedText = attributed
    if selectedRange.location + selectedRange.length <= attributed.length {
      textView.selectedRange = selectedRange
    }

    // Re-apply wrapping — setting attributedText resets text container properties
    configureWrapping(for: textView)
  }

  class Coordinator: NSObject, UITextViewDelegate {
    var parent: CodeTextEditor
    private var highlightTask: DispatchWorkItem?
    var lastFontSize: CGFloat?

    init(_ parent: CodeTextEditor) {
      self.parent = parent
    }

    // Handle Enter key and closing brackets for auto-indentation
    func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
      let fullText = textView.text ?? ""

      // === ENTER KEY ===
      if text == "\n" {
        let indent = IndentationHelper.calculateNewLineIndent(
          afterPosition: range.location,
          in: fullText
        )

        // Insert newline + indent
        textView.insertText("\n" + indent)

        // Update binding
        parent.text = textView.text

        // Trigger highlighting (debounced)
        scheduleHighlighting(for: textView)

        return false  // We handled it
      }

      // === CLOSING BRACKETS ===
      if let char = text.first, ["}","]",")"].contains(char) {
        if let dedentedIndent = IndentationHelper.calculateDedentedIndent(
          forClosingBracket: char,
          at: range.location,
          in: fullText
        ) {
          // Replace current line's indent with correct indent + bracket
          let currentLine = IndentationHelper.getLine(at: range.location, in: fullText)
          let currentIndent = IndentationHelper.getIndent(of: currentLine)

          // Find the start of the current line
          let nsText = fullText as NSString
          let lineRange = nsText.lineRange(for: NSRange(location: range.location, length: 0))
          let lineStart = lineRange.location

          // Calculate range of current indent
          let indentRange = NSRange(location: lineStart, length: currentIndent.count)

          // Replace indent and insert bracket
          if let textRange = Range(indentRange, in: textView.text ?? "") {
            textView.text.replaceSubrange(textRange, with: dedentedIndent)

            // Position cursor and insert bracket
            let newCursorPos = lineStart + dedentedIndent.count
            textView.selectedRange = NSRange(location: newCursorPos, length: 0)
            textView.insertText(String(char))

            parent.text = textView.text
            scheduleHighlighting(for: textView)
            return false
          }
        }
      }

      // === CLOSING JSX TAG ===
      if text == "/" {
        // Check if we just typed "<" (making "</")
        let nsText = fullText as NSString
        if range.location > 0 && nsText.substring(with: NSRange(location: range.location - 1, length: 1)) == "<" {
          // Check if at line start (only whitespace and "<" before cursor)
          let lineRange = nsText.lineRange(for: NSRange(location: range.location, length: 0))
          let lineStart = lineRange.location
          let beforeCursor = nsText.substring(with: NSRange(location: lineStart, length: range.location - lineStart))

          // Only the "<" should be there (with optional whitespace before it)
          let trimmed = beforeCursor.trimmingCharacters(in: .whitespaces)
          if trimmed == "<" {
            // Reduce indent by one level
            let currentLine = IndentationHelper.getLine(at: range.location, in: fullText)
            let currentIndent = IndentationHelper.getIndent(of: currentLine)

            if currentIndent.count >= IndentationHelper.indentUnit.count {
              let newIndent = String(currentIndent.dropLast(IndentationHelper.indentUnit.count))
              let indentRange = NSRange(location: lineStart, length: currentIndent.count)

              if let textRange = Range(indentRange, in: textView.text ?? "") {
                textView.text.replaceSubrange(textRange, with: newIndent)
                // Cursor is now at lineStart + newIndent.count + 1 (for "<")
                let newCursorPos = lineStart + newIndent.count + 1
                textView.selectedRange = NSRange(location: newCursorPos, length: 0)
                textView.insertText("/")

                parent.text = textView.text
                scheduleHighlighting(for: textView)
                return false
              }
            }
          }
        }
      }

      return true  // Let normal typing happen
    }

    func textViewDidChange(_ textView: UITextView) {
      // Update binding immediately for responsiveness
      parent.text = textView.text

      // Debounce highlighting to avoid lag while typing fast
      scheduleHighlighting(for: textView)
    }

    private func scheduleHighlighting(for textView: UITextView) {
      highlightTask?.cancel()
      let task = DispatchWorkItem { [weak self] in
        guard let self = self else { return }
        self.parent.applyHighlighting(to: textView)
      }
      highlightTask = task
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.15, execute: task)
    }
  }
}
#endif


// Copyright 2015-present 650 Industries. All rights reserved.

#if !os(macOS) && !os(tvOS)

import SwiftUI

enum SnappedEdge {
  case left, right
}

enum FABConstants {
  static let iconSize: CGFloat = 44
  static let touchTargetSize: CGFloat = 80 
  static let margin: CGFloat = 10
  static let verticalPadding: CGFloat = 0
  static let dragThreshold: CGFloat = 10
  static let momentumFactor: CGFloat = 0.35
  static let labelDismissDelay: TimeInterval = 10
  static let idleTimeout: UInt64 = 5_000_000_000
  static let imageSize: CGFloat = 26

  static let snapAnimation: Animation = .spring(
    response: 0.6,
    dampingFraction: 0.7,
    blendDuration: 0
  )
}

struct FabPill: View {
  @Binding var isPressed: Bool
  @Binding var isDragging: Bool
  let showsPanel: Bool
  @State private var showLabel = true
  @State private var isIdle = false
  @State private var idleTask: Task<Void, Never>?

  private var isInteracting: Bool {
    isPressed || isDragging
  }

  var body: some View {
    VStack(spacing: 8) {
      actionButton
        .scaleEffect(isPressed ? 0.9 : 1.0)
        .animation(.easeInOut(duration: 0.1), value: isPressed)
        .onChange(of: isInteracting) { interacting in
          if interacting {
            idleTask?.cancel()
            withAnimation {
              isIdle = false
            }
          } else {
            startIdleTimer()
          }
        }
        .onAppear {
          startIdleTimer()
        }

      if showLabel && !showsPanel {
        Text("Tools")
          .font(.system(size: 11, weight: .medium))
          .foregroundStyle(.secondary)
          .fixedSize()
          .padding(.horizontal, 8)
          .padding(.vertical, 3)
          .background(.regularMaterial, in: Capsule())
          .transition(.opacity.combined(with: .scale(scale: 0.8)))
      }
    }
    .task {
      // [Alan] This is poor practice but without it, the label is not included in the drag gesture
      // and remains in it's original posistion.
      try? await Task.sleep(nanoseconds: UInt64(1_000_000_000 * FABConstants.labelDismissDelay))
      await MainActor.run {
        withAnimation(.easeOut(duration: 0.3)) {
          showLabel = false
        }
      }
    }
  }

  @ViewBuilder
  private var actionButton: some View {
    if #available(iOS 26.0, *) {
      liquidGlassButton
    } else {
      classicButton
    }
  }

  private func startIdleTimer() {
    idleTask?.cancel()
    idleTask = Task {
      try? await Task.sleep(nanoseconds: FABConstants.idleTimeout)
      guard !Task.isCancelled else { return }
      await MainActor.run {
        withAnimation {
          isIdle = true
        }
      }
    }
  }

  @available(iOS 26.0, *)
  private var liquidGlassButton: some View {
    Image(systemName: "gearshape.fill")
      .resizable()
      .frame(width: FABConstants.imageSize, height: FABConstants.imageSize)
      .foregroundStyle(.white)
      .frame(width: FABConstants.iconSize, height: FABConstants.iconSize)
      .background(Color.blue, in: Circle())
      .background(
        Circle()
          .stroke(Color.blue.opacity(0.5), lineWidth: 4)
          .frame(width: FABConstants.iconSize + 4, height: FABConstants.iconSize + 4)
      )
      .shadow(color: .black.opacity(0.4), radius: 8, x: 0, y: 4)
  }

  private var classicButton: some View {
    Image(systemName: "gearshape.fill")
      .resizable()
      .frame(width: FABConstants.imageSize, height: FABConstants.imageSize)
      .foregroundStyle(.white)
      .frame(width: FABConstants.iconSize, height: FABConstants.iconSize)
      .background(Color.blue, in: Circle())
      .background(
        Circle()
          .stroke(Color.blue.opacity(0.5), lineWidth: 4)
          .frame(width: FABConstants.iconSize + 4, height: FABConstants.iconSize + 4)
      )
      .shadow(color: .black.opacity(0.4), radius: 8, x: 0, y: 4)
  }
}

/// Configuration for the FAB, determined once when it appears.
/// This replaces reactive session observation with a read-once approach.
struct FABConfiguration {
  let showPanel: Bool
  let snackName: String
  let snackDescription: String
  let isLesson: Bool
  let lessonId: Int?
}

struct DevMenuFABView: View {
  let onOpenMenu: () -> Void
  let onFrameChange: (CGRect) -> Void

  private let fabSize = CGSize(width: FABConstants.touchTargetSize, height: FABConstants.touchTargetSize + 50)
  private let panelHeight: CGFloat = 140  // Height of the larger panel
  private let panelVerticalOffset: CGFloat = 10  // How much panel is shifted down from gear
  private let screenEdgeMargin: CGFloat = 12

  // UserDefaults keys for persisting position
  private static let positionXKey = "DevMenuFAB.positionX"
  private static let positionYKey = "DevMenuFAB.positionY"
  private static let hasStoredPositionKey = "DevMenuFAB.hasStoredPosition"

  private static func loadStoredPosition() -> CGPoint? {
    guard UserDefaults.standard.bool(forKey: hasStoredPositionKey) else { return nil }
    let x = UserDefaults.standard.double(forKey: positionXKey)
    let y = UserDefaults.standard.double(forKey: positionYKey)
    return CGPoint(x: x, y: y)
  }

  private static func savePosition(_ position: CGPoint) {
    UserDefaults.standard.set(position.x, forKey: positionXKey)
    UserDefaults.standard.set(position.y, forKey: positionYKey)
    UserDefaults.standard.set(true, forKey: hasStoredPositionKey)
  }

  // FAB configuration - read once when view appears
  // Session state is guaranteed ready before FAB is shown (DevMenuManager waits for setup)
  @State private var config: FABConfiguration?

  @State private var position: CGPoint = .zero
  @State private var isDragging = false
  @State private var isDraggingPanel = false
  @State private var isPressed = false
  @State private var dragStartPosition: CGPoint = .zero
  @State private var screenWidth: CGFloat = 0
  @State private var screenHeight: CGFloat = 0
  @State private var currentEdge: SnappedEdge = .right
  @State private var isPositioned = false  // Hide until initial position is set
  @State private var hasBeenEdited = false  // Updated via notification since sessionClient isn't observable
  @State private var isLessonCompleted = false  // Updated manually since UserDefaults isn't observable

  // Convenience accessors from config
  private var snackName: String { config?.snackName ?? "" }
  private var snackDescription: String { config?.snackDescription ?? "Learn to code on mobile" }
  private var isLesson: Bool { config?.isLesson ?? false }

  /// Whether the panel is visible (for lessons and lesson-like snacks)
  private var showsPanel: Bool { config?.showPanel ?? false }

  private let dragSpring: Animation = .spring(
    response: 0.25,
    dampingFraction: 0.85,
    blendDuration: 0
  )

  /// Compute the hit test frame based on current state.
  /// When panel is visible (lessons or lesson-like snacks), the panel has equal margins on both sides.
  private func hitTestFrame(edge: SnappedEdge) -> CGRect {
    let showingPanel = showsPanel && !isDragging
    
    let touchTargetSize = FABConstants.touchTargetSize
    let buttonCenterY = position.y + FABConstants.iconSize / 2
    let touchTargetTop = buttonCenterY - touchTargetSize / 2

    if showingPanel {
      // Panel has equal margins on both sides
      let panelWidth = screenWidth - (screenEdgeMargin * 2)
      let panelY = buttonCenterY - FABConstants.iconSize / 2 + panelVerticalOffset

      return CGRect(
        x: screenEdgeMargin,
        y: panelY,
        width: panelWidth,
        height: panelHeight
      )
    } else {
      return CGRect(
        x: position.x,
        y: touchTargetTop,
        width: touchTargetSize,
        height: touchTargetSize
      )
    }
  }

  // Get safe area from window since .ignoresSafeArea() or initial render may zero out geometry values
  private var windowSafeArea: UIEdgeInsets {
    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
          let window = windowScene.windows.first else {
      return .zero
    }
    return window.safeAreaInsets
  }

  var body: some View {
    GeometryReader { geometry in
      // Use window safe area - geometry values may be incorrect initially or due to .ignoresSafeArea()
      let safeArea = EdgeInsets(
        top: windowSafeArea.top,
        leading: windowSafeArea.left,
        bottom: windowSafeArea.bottom,
        trailing: windowSafeArea.right
      )

      ZStack {
        if isPositioned {
          // Panel rendered behind the gear (for lessons and lesson-like snacks)
          if showsPanel {
            SnackActionPanel(
              isDragging: isDragging && !isDraggingPanel,
              snackName: snackName,
              snackDescription: snackDescription,
              snappedEdge: currentEdge,
              gearPosition: position,
              screenWidth: screenWidth,
              isLesson: isLesson,
              isLessonCompleted: isLessonCompleted,
              hasBeenEdited: hasBeenEdited,
              // onSave: handleSave,  // TODO: Add back when save functionality is implemented
              onComplete: handleComplete,
              onGoBack: handleGoBack
            )
            .gesture(panelDragGesture(bounds: geometry.size, safeArea: safeArea))
          }

          let buttonCenterX = position.x + FABConstants.touchTargetSize / 2
          let buttonCenterY = position.y + FABConstants.iconSize / 2
          
          Color.clear
            .frame(width: FABConstants.touchTargetSize, height: FABConstants.touchTargetSize)
            .contentShape(Circle())
            .position(x: buttonCenterX, y: buttonCenterY)
            .zIndex(2)
            .gesture(dragGesture(bounds: geometry.size, safeArea: safeArea))

          FabPill(isPressed: $isPressed, isDragging: $isDragging, showsPanel: showsPanel)
            .frame(width: FABConstants.touchTargetSize, height: fabSize.height, alignment: .top)
            .position(
              x: buttonCenterX,
              y: position.y + fabSize.height / 2
            )
            .zIndex(1)
            .allowsHitTesting(false)
        }
      }
      .onAppear {
        screenWidth = geometry.size.width
        screenHeight = geometry.size.height

        // Only initialize once - guard against multiple onAppear calls
        // (SwiftUI may call onAppear multiple times in certain scenarios)
        guard config == nil else { return }

        // Read session state ONCE - DevMenuManager ensures session is ready before showing FAB
        let session = SnackEditingSession.shared
        if session.isLessonLikeSession {
          config = FABConfiguration(
            showPanel: true,
            snackName: session.displayName,
            snackDescription: session.lessonDescription ?? "Your own space to explore and learn",
            isLesson: session.isLesson,
            lessonId: session.lessonId
          )
        } else {
          config = FABConfiguration(
            showPanel: false,
            snackName: "",
            snackDescription: "",
            isLesson: false,
            lessonId: nil
          )
        }

        // Initialize non-observable state
        hasBeenEdited = session.hasBeenEdited
        updateLessonCompletedState()

        let initialPos: CGPoint
        if showsPanel {
          initialPos = defaultPosition(bounds: geometry.size, safeArea: safeArea)
        } else if let storedPos = Self.loadStoredPosition() {
          // Clamp stored position to valid bounds
          let margin = FABConstants.margin
          let minX = margin / 2
          let maxX = geometry.size.width - fabSize.width - margin / 2
          let minY = safeArea.top + FABConstants.verticalPadding
          let maxY = geometry.size.height - fabSize.height - safeArea.bottom - FABConstants.verticalPadding

          initialPos = CGPoint(
            x: storedPos.x.clamped(to: minX...maxX),
            y: storedPos.y.clamped(to: minY...maxY)
          )
        } else {
          initialPos = defaultPosition(bounds: geometry.size, safeArea: safeArea)
        }

        // Set initial position without animation (position starts at .zero)
        var transaction = Transaction()
        transaction.disablesAnimations = true
        withTransaction(transaction) {
          position = initialPos
          currentEdge = initialPos.x < geometry.size.width / 2 ? .left : .right
          isPositioned = true
        }
        onFrameChange(hitTestFrame(edge: currentEdge))
      }
      .onChange(of: geometry.size) { newSize in
        screenWidth = newSize.width
        screenHeight = newSize.height
        let newPos = snapToEdge(
          from: position,
          velocity: .zero,
          bounds: newSize,
          safeArea: safeArea
        )
        // Disable animation for geometry-triggered repositioning
        var transaction = Transaction()
        transaction.disablesAnimations = true
        withTransaction(transaction) {
          position = newPos
          currentEdge = newPos.x < newSize.width / 2 ? .left : .right
        }
        onFrameChange(hitTestFrame(edge: currentEdge))
      }
      .onChange(of: isDragging) { _ in
        onFrameChange(hitTestFrame(edge: currentEdge))
      }
      .onChange(of: position) { newPos in
        currentEdge = newPos.x < screenWidth / 2 ? .left : .right
      }
      .animation(isDragging ? dragSpring : FABConstants.snapAnimation, value: position)
      // Listen for code changes since sessionClient.hasBeenEdited isn't directly observable
      .onReceive(NotificationCenter.default.publisher(for: SnackEditingSession.codeDidChangeNotification)) { _ in
        Task { @MainActor in
          hasBeenEdited = SnackEditingSession.shared.hasBeenEdited
        }
      }
    }
    .ignoresSafeArea()
  }

  // TODO: Add back when save functionality is implemented
  // private func handleSave() {
  //   print("Save tapped for snack: \(snackName)")
  // }

  private func handleGoBack() {
    DevMenuManager.shared.navigateHome()
  }

  private func handleComplete() {
    // Toggle lesson completion in UserDefaults
    if let lessonId = config?.lessonId {
      var completedLessons = UserDefaults.standard.array(forKey: "ExpoGoCompletedLessons") as? [Int] ?? []

      if isLessonCompleted {
        // Uncomplete: remove from list and stay on lesson
        completedLessons.removeAll { $0 == lessonId }
        UserDefaults.standard.set(completedLessons, forKey: "ExpoGoCompletedLessons")
        isLessonCompleted = false  // Update UI state
      } else {
        // Complete: add to list and navigate home
        if !completedLessons.contains(lessonId) {
          completedLessons.append(lessonId)
          UserDefaults.standard.set(completedLessons, forKey: "ExpoGoCompletedLessons")
        }
        DevMenuManager.shared.navigateHome()
      }
    }
  }

  /// Updates isLessonCompleted from UserDefaults (not observable, must be called manually)
  private func updateLessonCompletedState() {
    guard let lessonId = config?.lessonId else {
      isLessonCompleted = false
      return
    }
    let completedLessons = UserDefaults.standard.array(forKey: "ExpoGoCompletedLessons") as? [Int] ?? []
    isLessonCompleted = completedLessons.contains(lessonId)
  }

  private func dragGesture(bounds: CGSize, safeArea: EdgeInsets) -> some Gesture {
    DragGesture(minimumDistance: 0)
      .onChanged { value in
        if !isPressed {
          isPressed = true
        }
        if !isDragging && value.translation.magnitude > FABConstants.dragThreshold {
          isDragging = true
          isPressed = false
          dragStartPosition = position
        }
        if isDragging {
          let rawX = dragStartPosition.x + value.translation.width
          let rawY = dragStartPosition.y + value.translation.height

          position = CGPoint(x: rawX, y: rawY)
          let touchTargetSize = FABConstants.touchTargetSize
          let buttonCenterY = position.y + FABConstants.iconSize / 2
          onFrameChange(CGRect(x: position.x, y: buttonCenterY - touchTargetSize / 2, width: touchTargetSize, height: touchTargetSize))
        }
      }
      .onEnded { value in
        isPressed = false
        let dragDistance = value.translation.magnitude

        if dragDistance < FABConstants.dragThreshold {
          isDragging = false
          onOpenMenu()
        } else {
          let velocity = CGPoint(
            x: value.predictedEndLocation.x - value.location.x,
            y: value.predictedEndLocation.y - value.location.y
          )

          let newPos = snapToEdge(
            from: position,
            velocity: velocity,
            bounds: bounds,
            safeArea: safeArea
          )

          DispatchQueue.main.async {
            isDragging = false
            position = newPos
            // Don't persist position changes for panel sessions (lessons/lesson-like snacks)
            if !showsPanel {
              Self.savePosition(newPos)
            }
            let touchTargetSize = FABConstants.touchTargetSize
            let buttonCenterY = newPos.y + FABConstants.iconSize / 2
            onFrameChange(CGRect(x: newPos.x, y: buttonCenterY - touchTargetSize / 2, width: touchTargetSize, height: touchTargetSize))
          }
        }
      }
  }

  private func panelDragGesture(bounds: CGSize, safeArea: EdgeInsets) -> some Gesture {
    DragGesture(minimumDistance: FABConstants.dragThreshold)
      .onChanged { value in
        if !isDragging {
          isDragging = true
          isDraggingPanel = true
          dragStartPosition = position
        }
        let rawY = dragStartPosition.y + value.translation.height
        position = CGPoint(x: position.x, y: rawY)
        let touchTargetSize = FABConstants.touchTargetSize
        let buttonCenterY = position.y + FABConstants.iconSize / 2
        onFrameChange(CGRect(x: position.x, y: buttonCenterY - touchTargetSize / 2, width: touchTargetSize, height: touchTargetSize))
      }
      .onEnded { value in
        let velocity = CGPoint(
          x: 0,
          y: value.predictedEndLocation.y - value.location.y
        )

        let newPos = snapToEdge(
          from: position,
          velocity: velocity,
          bounds: bounds,
          safeArea: safeArea
        )

        DispatchQueue.main.async {
          isDragging = false
          isDraggingPanel = false
          position = newPos
          let touchTargetSize = FABConstants.touchTargetSize
          let buttonCenterY = newPos.y + FABConstants.iconSize / 2
          onFrameChange(CGRect(x: newPos.x, y: buttonCenterY - touchTargetSize / 2, width: touchTargetSize, height: touchTargetSize))
        }
      }
  }

  private func defaultPosition(bounds: CGSize, safeArea: EdgeInsets) -> CGPoint {
    return CGPoint(
      x: bounds.width - fabSize.width - FABConstants.margin / 2,
      y: safeArea.top + FABConstants.verticalPadding
    )
  }

  private func snapToEdge(
    from point: CGPoint,
    velocity: CGPoint,
    bounds: CGSize,
    safeArea: EdgeInsets
  ) -> CGPoint {
    let margin = FABConstants.margin
    let edgeMargin = margin / 2  // Closer to screen edge when snapped
    let momentumX = velocity.x * FABConstants.momentumFactor
    let momentumY = velocity.y * FABConstants.momentumFactor

    let estimatedCenterX = point.x + self.fabSize.width / 2 + momentumX
    let targetX: CGFloat = estimatedCenterX < bounds.width / 2
      ? edgeMargin
    : bounds.width - self.fabSize.width - edgeMargin

    let minY = safeArea.top + FABConstants.verticalPadding
    let maxY: CGFloat
    if showsPanel {
      // Panel bottom should sit just above the safe area
      maxY = bounds.height - safeArea.bottom - panelHeight - panelVerticalOffset
    } else {
      maxY = bounds.height - fabSize.height - safeArea.bottom - FABConstants.verticalPadding
    }
    let targetY = (point.y + momentumY).clamped(to: minY...maxY)

    return CGPoint(x: targetX, y: targetY)
  }
}

private extension CGSize {
  var magnitude: CGFloat {
    sqrt(width * width + height * height)
  }
}

private extension Comparable {
  func clamped(to range: ClosedRange<Self>) -> Self {
    min(max(self, range.lowerBound), range.upperBound)
  }
}

#endif

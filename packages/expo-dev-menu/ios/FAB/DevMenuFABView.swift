// Copyright 2015-present 650 Industries. All rights reserved.

#if !os(macOS) && !os(tvOS)

import SwiftUI

enum SnappedEdge {
  case left, right
}

enum FABConstants {
  static let iconSize: CGFloat = 44
  static let margin: CGFloat = 10
  static let verticalPadding: CGFloat = 20
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

      if showLabel {
        Text("Dev tools")
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

struct DevMenuFABView: View {
  let onOpenMenu: () -> Void
  let onFrameChange: (CGRect) -> Void

  private let fabSize = CGSize(width: 72, height: FABConstants.iconSize + 50)
  private let panelWidth: CGFloat = 180  // Width of panel portion (excluding gear)

  @State private var position: CGPoint = .zero
  @State private var isDragging = false
  @State private var isPressed = false
  @State private var dragStartPosition: CGPoint = .zero
  @State private var isSnackSession = false
  @State private var snackName = "Playground"
  @State private var screenWidth: CGFloat = 0

  private let dragSpring: Animation = .spring(
    response: 0.35,
    dampingFraction: 0.35,
    blendDuration: 0
  )

  /// Compute the hit test frame based on current state.
  /// When panel is visible, extends from gear position to include the panel.
  private func hitTestFrame(edge: SnappedEdge) -> CGRect {
    let showingPanel = isSnackSession && !isDragging

    if showingPanel {
      // Panel extends inward from gear
      let totalWidth = fabSize.width + panelWidth
      let height = fabSize.height

      if edge == .right {
        // Gear on right, panel extends left
        return CGRect(
          x: position.x - panelWidth,
          y: position.y,
          width: totalWidth,
          height: height
        )
      } else {
        // Gear on left, panel extends right
        return CGRect(
          x: position.x,
          y: position.y,
          width: totalWidth,
          height: height
        )
      }
    } else {
      return CGRect(origin: position, size: fabSize)
    }
  }

  var body: some View {
    GeometryReader { geometry in
      let safeArea = geometry.safeAreaInsets
      let edge: SnappedEdge = position.x < geometry.size.width / 2 ? .left : .right

      // The content is positioned so the gear button stays at `position`
      // When showing SnackFabPill, the panel extends from the gear via offset
      Group {
        if isSnackSession {
          SnackFabPill(
            isPressed: $isPressed,
            isDragging: $isDragging,
            snappedEdge: edge,
            snackName: snackName,
            onSave: handleSave
          )
        } else {
          FabPill(isPressed: $isPressed, isDragging: $isDragging)
        }
      }
      .frame(width: fabSize.width, height: fabSize.height)
      .position(
        x: position.x + fabSize.width / 2,
        y: position.y + fabSize.height / 2
      )
      .gesture(dragGesture(bounds: geometry.size, safeArea: safeArea))
      .onAppear {
        screenWidth = geometry.size.width
        let initialPos = defaultPosition(bounds: geometry.size, safeArea: safeArea)
        position = initialPos
        onFrameChange(hitTestFrame(edge: .right))
        updateSnackSessionState()
      }
      .onChange(of: geometry.size) { newSize in
        screenWidth = newSize.width
        let newPos = snapToEdge(
          from: position,
          velocity: .zero,
          bounds: newSize,
          safeArea: safeArea
        )
        position = newPos
        let newEdge: SnappedEdge = newPos.x < newSize.width / 2 ? .left : .right
        onFrameChange(hitTestFrame(edge: newEdge))
      }
      .onChange(of: isSnackSession) { _ in
        onFrameChange(hitTestFrame(edge: edge))
      }
      .onChange(of: isDragging) { _ in
        onFrameChange(hitTestFrame(edge: edge))
      }
      .animation(isDragging ? dragSpring : FABConstants.snapAnimation, value: position)
      .onReceive(NotificationCenter.default.publisher(for: SnackEditingSession.sessionDidChangeNotification)) { _ in
        updateSnackSessionState()
      }
    }
    .ignoresSafeArea()
  }

  private func updateSnackSessionState() {
    let session = SnackEditingSession.shared
    isSnackSession = session.isReady
    if let id = session.snackId {
      // Extract a display name from the snack ID
      // e.g., "@username/my-snack" -> "my-snack", "new" -> "Playground"
      if id == "new" {
        snackName = "Playground"
      } else if let lastSlash = id.lastIndex(of: "/") {
        snackName = String(id[id.index(after: lastSlash)...])
      } else {
        snackName = id
      }
    } else {
      snackName = "Playground"
    }
  }

  private func handleSave() {
    // TODO: Implement save functionality
    print("Save tapped for snack: \(snackName)")
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
          let margin = FABConstants.margin
          let minX = margin
          let maxX = bounds.width - fabSize.width - margin
          let minY = margin + safeArea.top + FABConstants.verticalPadding
          let maxY = bounds.height - fabSize.height - margin - safeArea.bottom - FABConstants.verticalPadding

          let rawX = dragStartPosition.x + value.translation.width
          let rawY = dragStartPosition.y + value.translation.height

          position = CGPoint(
            x: rawX.clamped(to: minX...maxX),
            y: rawY.clamped(to: minY...maxY)
          )
          onFrameChange(CGRect(origin: position, size: fabSize))
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
            onFrameChange(CGRect(origin: newPos, size: fabSize))
          }
        }
      }
  }

  private func defaultPosition(bounds: CGSize, safeArea: EdgeInsets) -> CGPoint {
    CGPoint(
      x: bounds.width - fabSize.width - FABConstants.margin,
      y: bounds.height * 0.25
    )
  }

  private func snapToEdge(
    from point: CGPoint,
    velocity: CGPoint,
    bounds: CGSize,
    safeArea: EdgeInsets
  ) -> CGPoint {
    let margin = FABConstants.margin
    let momentumX = velocity.x * FABConstants.momentumFactor
    let momentumY = velocity.y * FABConstants.momentumFactor

    let estimatedCenterX = point.x + self.fabSize.width / 2 + momentumX
    let targetX: CGFloat = estimatedCenterX < bounds.width / 2
      ? margin
    : bounds.width - self.fabSize.width - margin

    let minY = margin + safeArea.top + FABConstants.verticalPadding
    let maxY = bounds.height - self.fabSize.height - margin - safeArea.bottom - FABConstants.verticalPadding
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

// Copyright 2015-present 650 Industries. All rights reserved.

#if !os(macOS) && !os(tvOS)

import SwiftUI

enum FABConstants {
  static let iconSize: CGFloat = 44
  static let margin: CGFloat = 16
  static let dragThreshold: CGFloat = 10
  static let momentumFactor: CGFloat = 0.35
  static let labelDismissDelay: TimeInterval = 10

  static let snapAnimation: Animation = .spring(
    response: 0.6,
    dampingFraction: 0.7,
    blendDuration: 0
  )
}

struct FabPill: View {
  @Binding var isPressed: Bool
  @State private var showLabel = true

  var body: some View {
    VStack(spacing: 4) {
      Image(systemName: "gearshape.fill")
        .font(.system(size: 20))
        .foregroundStyle(.white)
        .frame(width: FABConstants.iconSize, height: FABConstants.iconSize)
        .background(Color.blue, in: Circle())
        .overlay(
          Circle()
            .stroke(Color.blue.opacity(0.5), lineWidth: 4)
            .frame(width: FABConstants.iconSize + 4, height: FABConstants.iconSize + 4)
        )
        .scaleEffect(isPressed ? 0.9 : 1.0)
        .animation(.easeInOut(duration: 0.1), value: isPressed)

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
      try? await Task.sleep(nanoseconds: UInt64(1_000_000_000 * FABConstants.labelDismissDelay))
      await MainActor.run {
        withAnimation(.easeOut(duration: 0.3)) {
          showLabel = false
        }
      }
    }
  }
}

struct DevMenuFABView: View {
  let onOpenMenu: () -> Void
  let onFrameChange: (CGRect) -> Void

  private let fabSize = CGSize(width: 72, height: FABConstants.iconSize + 24)

  @State private var position: CGPoint = .zero
  @State private var targetPosition: CGPoint = .zero
  @State private var isDragging = false
  @State private var isPressed = false
  @State private var dragStartPosition: CGPoint = .zero

  private let dragSpring: Animation = .spring(
    response: 0.35,
    dampingFraction: 0.35,
    blendDuration: 0
  )

  private var currentFrame: CGRect {
    CGRect(origin: position, size: fabSize)
  }

  var body: some View {
    GeometryReader { geometry in
      let safeArea = geometry.safeAreaInsets
      FabPill(isPressed: $isPressed)
        .frame(width: fabSize.width, height: fabSize.height)
        .position(x: currentFrame.midX, y: currentFrame.midY)
        .gesture(dragGesture(bounds: geometry.size, safeArea: safeArea))
        .onAppear {
          let initialPos = defaultPosition(bounds: geometry.size, safeArea: safeArea)
          position = initialPos
          onFrameChange(CGRect(origin: initialPos, size: fabSize))
        }
        .onChange(of: geometry.size) { newSize in
          let newPos = snapToEdge(
            from: position,
            velocity: .zero,
            bounds: newSize,
            safeArea: safeArea
          )
          position = newPos
          onFrameChange(CGRect(origin: newPos, size: fabSize))
        }
        .animation(isDragging ? dragSpring : FABConstants.snapAnimation, value: position)
    }
    .ignoresSafeArea()
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
          let minY = margin + safeArea.top
          let maxY = bounds.height - fabSize.height - margin - safeArea.bottom

          let rawX = dragStartPosition.x + value.translation.width
          let rawY = dragStartPosition.y + value.translation.height

          position = CGPoint(
            x: rawX.clamped(to: minX...maxX),
            y: rawY.clamped(to: minY...maxY)
          )
          onFrameChange(currentFrame)
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
      y: (bounds.height / 2) - fabSize.height
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

    let minY = margin + safeArea.top
    let maxY = bounds.height - self.fabSize.height - margin - safeArea.bottom
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

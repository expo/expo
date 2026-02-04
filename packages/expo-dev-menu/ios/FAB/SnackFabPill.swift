// Copyright 2015-present 650 Industries. All rights reserved.

#if !os(macOS) && !os(tvOS)

import SwiftUI

/// Shared gear button used by FabPill and rendered separately for snack sessions
struct FabGearButton: View {
  let isPressed: Bool

  var body: some View {
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
      .scaleEffect(isPressed ? 0.9 : 1.0)
      .animation(.easeInOut(duration: 0.1), value: isPressed)
  }
}

/// Standalone action panel for snack sessions.
/// Rendered in overlay, completely separate from the gear button's animation hierarchy.
/// The panel is a wide rectangle with the gear icon overlapping its corner.
struct SnackActionPanel: View {
  let isDragging: Bool
  let snackName: String
  let snackDescription: String
  let snappedEdge: SnappedEdge
  let gearPosition: CGPoint  // Top-left of gear frame
  let screenWidth: CGFloat
  let isLesson: Bool
  let isLessonCompleted: Bool
  let hasBeenEdited: Bool
  // let onSave: () -> Void  // TODO: Add back when save functionality is implemented
  let onComplete: () -> Void
  let onGoBack: () -> Void

  // Panel dimensions
  private let panelHeight: CGFloat = 140
  private let screenEdgeMargin: CGFloat = 12

  // The gearPosition is the top-left of the FAB frame (72x94).
  // The gear icon (44x44) is centered within that frame.
  private let fabFrameWidth: CGFloat = 72
  private let fabFrameHeight: CGFloat = FABConstants.iconSize + 50  // 94

  // Gear icon center within the screen
  private var gearCenterX: CGFloat {
    gearPosition.x + fabFrameWidth / 2
  }

  private var gearCenterY: CGFloat {
    gearPosition.y + fabFrameHeight / 2
  }

  // Offsets to tuck panel under the gear more
  private let verticalOffset: CGFloat = 10  // Panel moves down, gear appears higher
  private let horizontalOverlap: CGFloat = 8  // Panel extends under gear more

  // Panel width - extends slightly under the gear on both sides
  private var panelWidth: CGFloat {
    screenWidth - (screenEdgeMargin * 2) + (horizontalOverlap * 2)
  }

  // Panel X position - shifted inward to tuck under gear
  private var panelX: CGFloat {
    screenEdgeMargin - horizontalOverlap
  }

  // Panel Y position - shifted down so gear appears higher
  private var panelY: CGFloat {
    gearCenterY - FABConstants.iconSize / 2 + verticalOffset
  }

  // Padding for title row (same on both sides to center)
  private let titlePadding: CGFloat = 65
  private let descriptionPadding: CGFloat = 32
  private let normalPadding: CGFloat = 16

  private var shouldShow: Bool {
    !isDragging && screenWidth > 0
  }

  var body: some View {
    Group {
      if shouldShow {
        panelContent
          .frame(width: panelWidth, height: panelHeight)
          .position(
            x: panelX + panelWidth / 2,
            y: panelY + panelHeight / 2
          )
          .transition(.asymmetric(
            insertion: .opacity.combined(with: .scale(scale: 0.9, anchor: snappedEdge == .right ? .topTrailing : .topLeading)),
            removal: .opacity.combined(with: .scale(scale: 0.95, anchor: snappedEdge == .right ? .topTrailing : .topLeading))
          ))
      }
    }
    .animation(.easeOut(duration: 0.2), value: shouldShow)
  }

  private var panelContent: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Snack name - centered, single line, non-editable
      Text(snackName)
        .font(.system(size: 17, weight: .semibold))
        .foregroundColor(.primary)
        .lineLimit(1)
        .frame(maxWidth: .infinity)
        .padding(.horizontal, titlePadding)
        .padding(.top, 20)

      // Description row - centered, single line, non-editable
      Text(snackDescription)
        .font(.system(size: 14))
        .foregroundColor(.secondary)
        .lineLimit(1)
        .frame(maxWidth: .infinity)
        .padding(.horizontal, descriptionPadding)
        .padding(.top, 7)

      Spacer()

      // Action buttons at bottom - always show Go back, conditionally show Complete for lessons
      HStack {
        goBackButton
        Spacer()
        if isLesson {
          completeButton
            .disabled(!isLessonCompleted && !hasBeenEdited)
        }
      }
      .padding(.horizontal, normalPadding)
      .padding(.bottom, 16)
    }
    .background(glassBackground)
    .clipShape(RoundedRectangle(cornerRadius: 20))
    .shadow(color: .black.opacity(0.15), radius: 12, x: 0, y: 4)
  }

  private var goBackButton: some View {
    Button(action: onGoBack) {
      HStack(spacing: 6) {
        Image(systemName: "chevron.left")
          .font(.system(size: 13, weight: .semibold))
        Text("Go back")
          .font(.system(size: 14, weight: .semibold))
      }
      .foregroundColor(.primary)
      .padding(.horizontal, 16)
      .padding(.vertical, 10)
      .background(.ultraThinMaterial, in: Capsule())
    }
    .buttonStyle(.plain)
  }

  private var isCompleteButtonEnabled: Bool {
    isLessonCompleted || hasBeenEdited
  }

  private var completeButton: some View {
    Button(action: onComplete) {
      HStack(spacing: 6) {
        Image(systemName: isLessonCompleted ? "checkmark.circle.fill" : "checkmark.circle")
          .font(.system(size: 13, weight: .semibold))
        Text(isLessonCompleted ? "Done!" : "Mark complete")
          .font(.system(size: 14, weight: .semibold))
      }
      .foregroundColor(isCompleteButtonEnabled ? .white : .secondary)
      .padding(.horizontal, 16)
      .padding(.vertical, 10)
      .background(
        isLessonCompleted ? Color.green :
          (isCompleteButtonEnabled ? Color.blue : Color.secondary.opacity(0.3)),
        in: Capsule()
      )
    }
    .buttonStyle(.plain)
  }

  // TODO: Add back when save functionality is implemented
  // private var saveButton: some View {
  //   Button(action: onSave) {
  //     HStack(spacing: 6) {
  //       Image(systemName: "square.and.arrow.down")
  //         .font(.system(size: 13, weight: .semibold))
  //       Text("Save")
  //         .font(.system(size: 14, weight: .semibold))
  //     }
  //     .foregroundColor(.white)
  //     .padding(.horizontal, 16)
  //     .padding(.vertical, 10)
  //     .background(Color.blue, in: Capsule())
  //   }
  //   .buttonStyle(.plain)
  // }

  private var glassBackground: some View {
    ZStack {
      // Ultra thin material for glass blur effect
      Rectangle()
        .fill(.ultraThinMaterial)

      // Subtle gradient overlay for depth
      LinearGradient(
        colors: [
          Color.blue.opacity(0.06),
          Color.purple.opacity(0.03),
          Color.clear
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
      )
    }
  }
}

#endif

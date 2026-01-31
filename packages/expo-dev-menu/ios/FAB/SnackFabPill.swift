// Copyright 2015-present 650 Industries. All rights reserved.

#if !os(macOS) && !os(tvOS)

import SwiftUI

/// Shared gear button used by both FabPill and SnackFabPill
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

/// FAB variant that shows a snack action panel extending from the gear button.
/// The panel contains the snack name and a save button.
/// When dragging, the panel hides and only the gear moves.
struct SnackFabPill: View {
  @Binding var isPressed: Bool
  @Binding var isDragging: Bool
  let snappedEdge: SnappedEdge
  let snackName: String
  let onSave: () -> Void

  @State private var showPanel = true

  var body: some View {
    // Use ZStack so the gear defines the frame size, panel overflows
    ZStack {
      // Gear button - this defines the view's size
      FabGearButton(isPressed: isPressed)

      // Panel positioned to the side using offset
      if showPanel {
        panelContent
          .fixedSize()
          .offset(x: snappedEdge == .right ? -panelOffset : panelOffset)
          .transition(.asymmetric(
            insertion: .opacity.combined(with: .scale(scale: 0.8, anchor: snappedEdge == .right ? .trailing : .leading)),
            removal: .opacity.combined(with: .scale(scale: 0.9, anchor: snappedEdge == .right ? .trailing : .leading))
          ))
      }
    }
    .onChange(of: isDragging) { dragging in
      withAnimation(.easeInOut(duration: 0.15)) {
        showPanel = !dragging
      }
    }
  }

  // Distance from gear center to panel center
  private var panelOffset: CGFloat {
    // Gear radius + gap + half panel width (estimated)
    FABConstants.iconSize / 2 + 8 + 90
  }

  private var panelContent: some View {
    HStack(spacing: 10) {
      Text(snackName)
        .font(.system(size: 14, weight: .medium))
        .foregroundColor(.primary)
        .lineLimit(1)
        .truncationMode(.middle)
        .frame(maxWidth: 120)

      Button(action: onSave) {
        Text("Save")
          .font(.system(size: 12, weight: .semibold))
          .padding(.horizontal, 12)
          .padding(.vertical, 6)
          .background(Color.blue)
          .foregroundColor(.white)
          .cornerRadius(6)
      }
      .buttonStyle(.plain)
    }
    .padding(.leading, snappedEdge == .right ? 14 : 8)
    .padding(.trailing, snappedEdge == .left ? 14 : 8)
    .padding(.vertical, 10)
    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 22))
  }
}

#endif

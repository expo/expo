// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI

/// Remembers which annotations have already been shown, so that with `animateAnnotations` an
/// annotation animates in only the first time it appears: not when its content changes, and not
/// when MapKit recreates its view after it was scrolled off screen and back.
final class AnnotationAppearances {
  private var shownIds = Set<String>()

  func hasShown(_ id: String) -> Bool {
    shownIds.contains(id)
  }

  func markShown(_ id: String) {
    shownIds.insert(id)
  }

  /// Forgets annotations that are no longer on the map, so they animate in again if they come back.
  func retain(_ ids: [String]) {
    shownIds.formIntersection(ids)
  }
}

/// The content of an `Annotation`: its icon, or a colored rounded rectangle, with the text on top.
///
/// With `appearances` set, the content fades and scales in the first time the annotation appears.
/// Removal is not animated: MapKit's `MapContent` `ForEach` offers no transition for it.
@available(iOS 17.0, *)
struct AnnotationContent: View {
  let annotation: MapAnnotation
  let appearances: AnnotationAppearances?
  @State private var isShown: Bool

  init(annotation: MapAnnotation, appearances: AnnotationAppearances?) {
    self.annotation = annotation
    self.appearances = appearances
    _isShown = State(initialValue: appearances?.hasShown(annotation.id) ?? true)
  }

  var body: some View {
    ZStack {
      if let icon = annotation.icon {
        Image(uiImage: icon.ref)
          .resizable()
          .frame(width: 50, height: 50)
      } else {
        RoundedRectangle(cornerRadius: 5)
          .fill(annotation.backgroundColor)
      }
      Text(annotation.text)
        .foregroundStyle(annotation.textColor)
        .padding(5)
    }
    .opacity(isShown ? 1 : 0)
    .scaleEffect(isShown ? 1 : 0.6)
    .animation(.easeInOut(duration: 0.22), value: isShown)
    .onAppear {
      appearances?.markShown(annotation.id)
      isShown = true
    }
  }
}

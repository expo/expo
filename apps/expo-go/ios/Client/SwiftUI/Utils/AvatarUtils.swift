// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

func getAvatarColor(for firstLetter: String) -> (background: Color, foreground: Color) {
  switch firstLetter.lowercased() {
  case "a"..."d":
    return (Color.blue.opacity(0.2), Color.blue)
  case "e"..."h":
    return (Color.green.opacity(0.2), Color.green)
  case "i"..."l":
    return (Color.yellow.opacity(0.2), Color.orange)
  case "m"..."p":
    return (Color.orange.opacity(0.2), Color.orange)
  case "q"..."t":
    return (Color.red.opacity(0.2), Color.red)
  case "u"..."z":
    return (Color.pink.opacity(0.2), Color.pink)
  default:
    return (Color.purple.opacity(0.2), Color.purple)
  }
}

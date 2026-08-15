// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

class DevMenuGestureRecognizer: UILongPressGestureRecognizer {
  init() {
    super.init(target: nil, action: nil)
    numberOfTouchesRequired = 3
    minimumPressDuration = 0.5
    allowableMovement = 30
  }
}

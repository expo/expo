//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct AccountSheet: View {
  var body: some View {
#if targetEnvironment(simulator)
    SimulatorAccountView()
#else
    DeviceAccountView()
#endif
  }
}

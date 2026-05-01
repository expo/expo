// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class LazyListForEachProps: UIBaseViewProps {
  @Field var items: [[String: Any]]?
}

struct LazyListForEachView: ExpoSwiftUI.View {
  @ObservedObject var props: LazyListForEachProps

  init(props: LazyListForEachProps) {
    self.props = props
  }

  var body: some View {
    ForEach(identifyDescriptors(props.items ?? [])) { item in
      DescriptorView(descriptor: item.descriptor)
    }
  }
}

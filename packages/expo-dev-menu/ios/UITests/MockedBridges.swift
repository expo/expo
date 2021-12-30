@testable import EXDevMenu
@testable import EXDevMenuInterface

class UIMockedNOOPBridge: RCTBridge {
  override func invalidate() {
    // NOOP
  }

  override func setUp() {
    bundleURL = URL(string: "http://localhost:1234")
  }
}

class BridgeWithDevMenuExtension: UIMockedNOOPBridge {
  var extensions: [DevMenuExtensionProtocol] = []

  override func modulesConforming(to protocolClass: Protocol!) -> [Any]! {
    let extensionProtocol: Protocol = DevMenuExtensionProtocol.self
    if protocolClass === extensionProtocol {
      return extensions
    }
    return []
  }

  override func module(forName moduleName: String!) -> Any! {
    return extensions.first(where: {
      type(of: $0).moduleName?() == moduleName
    })
  }
}

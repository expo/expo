import EXDevMenuInterface

@objc
public class EXDevLauncherMenuDelegate : NSObject, DevMenuDelegateProtocol {
  private let bridge: RCTBridge
  
  @objc
  public init(withBridge bridge: RCTBridge) {
    self.bridge = bridge
  }
  
  public func appBridge(forDevMenuManager manager: DevMenuManagerProtocol) -> AnyObject? {
    return self.bridge;
  }
}

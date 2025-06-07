import ExpoModulesCore
import WebKit

class PeekAndPopPreviewView: ExpoView {
    let onSetSize = EventDispatcher()
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    public func setInitialSize(bounds: CGRect){
        onSetSize([
            "width": bounds.width,
            "height": bounds.height
        ])
    }
}

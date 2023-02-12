import Foundation

@objc class CellContainer: UIView {
    var index: Int = -1
    
    @objc func setIndex(_ index: Int) {
        self.index = index
    }
}

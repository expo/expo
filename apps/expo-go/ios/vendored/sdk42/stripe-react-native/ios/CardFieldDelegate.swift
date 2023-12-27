import Foundation

protocol CardFieldDelegate {
    func onDidCreateViewInstance(id: String, reference: Any?) -> Void
    func onDidDestroyViewInstance(id: String) -> Void
}

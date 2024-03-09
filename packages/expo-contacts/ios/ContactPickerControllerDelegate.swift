import ContactsUI
import ExpoModulesCore


protocol OnContactPickingResultHandler {
  func didPickContact(contact: CNContact)
  func didCancelPickingContact()
}

class ContactPickerControllerDelegate: NSObject, CNContactPickerDelegate {
  private let onContactPickingResultHandler: OnContactPickingResultHandler

  func contactPicker(_ picker: CNContactPickerViewController, didSelect contact: CNContact) {
    self.onContactPickingResultHandler.didPickContact(contact: contact)
    
    picker.dismiss(animated: true)
  }
  
  func contactPickerDidCancel(_ picker: CNContactPickerViewController) {
    self.onContactPickingResultHandler.didCancelPickingContact()
  }
  
  init(onContactPickingResultHandler: OnContactPickingResultHandler) {
    self.onContactPickingResultHandler = onContactPickingResultHandler
  }
}

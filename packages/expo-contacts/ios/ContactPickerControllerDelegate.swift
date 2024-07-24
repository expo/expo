import ContactsUI
import ExpoModulesCore

protocol OnContactPickingResultHandler {
  func didPickContact(contact: CNContact) throws
  func didCancelPickingContact()
}

class ContactPickerControllerDelegate: NSObject, CNContactPickerDelegate {
  private let onContactPickingResultHandler: OnContactPickingResultHandler

  init(onContactPickingResultHandler: OnContactPickingResultHandler) {
    self.onContactPickingResultHandler = onContactPickingResultHandler
  }

  func contactPicker(_ picker: CNContactPickerViewController, didSelect contact: CNContact) {
    do {
      try self.onContactPickingResultHandler.didPickContact(contact: contact)
    } catch {}

    picker.dismiss(animated: true)
  }

  func contactPickerDidCancel(_ picker: CNContactPickerViewController) {
    self.onContactPickingResultHandler.didCancelPickingContact()
  }
}

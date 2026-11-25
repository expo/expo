import ContactsUI

class MultipleContactsPickerControllerDelegate: NSObject, CNContactPickerDelegate {
  private let onPick: ([CNContact]) -> Void
  private let onCancel: () -> Void

  init(onPick: @escaping ([CNContact]) -> Void, onCancel: @escaping () -> Void) {
    self.onPick = onPick
    self.onCancel = onCancel
  }

  func contactPicker(_ picker: CNContactPickerViewController, didSelect contacts: [CNContact]) {
    onPick(contacts)
  }

  func contactPickerDidCancel(_ picker: CNContactPickerViewController) {
    onCancel()
  }
}

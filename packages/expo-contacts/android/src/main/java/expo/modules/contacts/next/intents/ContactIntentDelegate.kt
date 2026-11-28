package expo.modules.contacts.next.intents

import android.content.ContentValues
import android.net.Uri
import expo.modules.kotlin.activityresult.AppContextActivityResultCaller
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher

class ContactIntentDelegate {
  private lateinit var editContactLauncher: AppContextActivityResultLauncher<EditContactInput, Boolean>
  private lateinit var addContactLauncher: AppContextActivityResultLauncher<AddContactInput, Boolean>
  private lateinit var pickContactLauncher: AppContextActivityResultLauncher<PickContactInput, Uri?>
  private lateinit var pickContactDetailsLauncher: AppContextActivityResultLauncher<PickContactDetailsInput, Uri?>
  private lateinit var pickContactDataLauncher: AppContextActivityResultLauncher<PickContactDataInput, Uri?>

  suspend fun AppContextActivityResultCaller.registerContactContracts() {
    editContactLauncher = registerForActivityResult(EditContactContract())
    addContactLauncher = registerForActivityResult(AddContactContract())
    pickContactLauncher = registerForActivityResult(PickContactContract())
    pickContactDetailsLauncher = registerForActivityResult(PickContactDetailsContract())
    pickContactDataLauncher = registerForActivityResult(PickContactDataContract())
  }

  suspend fun launchEditContact(lookupKeyUri: Uri) =
    editContactLauncher.launch(EditContactInput(lookupKeyUri))

  suspend fun launchAddContact(contentValues: List<ContentValues>) =
    addContactLauncher.launch(AddContactInput(contentValues))

  suspend fun launchPickContact() =
    pickContactLauncher.launch(PickContactInput())

  suspend fun launchPickContactDetails(mimeTypes: List<String>): Uri? {
    val input = PickContactDetailsInput(ArrayList(mimeTypes))
    return pickContactDetailsLauncher.launch(input)
  }

  suspend fun launchPickContactData(contentUri: Uri): Uri? {
    val input = PickContactDataInput(contentUri.toString())
    return pickContactDataLauncher.launch(input)
  }
}

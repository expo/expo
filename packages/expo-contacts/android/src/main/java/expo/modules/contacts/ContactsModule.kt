package expo.modules.contacts

import android.Manifest
import expo.modules.core.ExportedModule
import expo.modules.contacts.ContactsModule.ContactsActivityEventListener
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.contacts.Contact
import android.os.Bundle
import android.os.Parcelable
import android.content.ContentProviderOperation
import android.content.ContentProviderResult
import android.provider.ContactsContract
import android.content.Intent
import expo.modules.contacts.ContactsModule
import android.os.AsyncTask
import android.content.ContentResolver
import expo.modules.contacts.models.PostalAddressModel
import expo.modules.contacts.models.PhoneNumberModel
import expo.modules.contacts.models.EmailModel
import expo.modules.contacts.models.ImAddressModel
import expo.modules.contacts.models.UrlAddressModel
import expo.modules.contacts.models.ExtraNameModel
import expo.modules.contacts.models.DateModel
import expo.modules.contacts.models.RelationshipModel
import android.provider.ContactsContract.CommonDataKinds
import expo.modules.contacts.EXColumns
import android.app.Activity
import android.content.Context
import android.database.Cursor
import android.net.Uri
import expo.modules.contacts.models.BaseModel
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.permissions.Permissions
import java.lang.Exception
import java.util.*

class ContactsModule(context: Context?) : ExportedModule(context) {
  private val mActivityEventListener: ActivityEventListener = ContactsActivityEventListener()
  private var mModuleRegistry: ModuleRegistry? = null
  private var mPendingPromise: Promise? = null
  override fun getName(): String {
    return "ExpoContacts"
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mModuleRegistry = moduleRegistry
    val uiManager = mModuleRegistry!!.getModule(UIManager::class.java)
    uiManager.registerActivityEventListener(mActivityEventListener)
  }

  @ExpoMethod
  fun requestPermissionsAsync(promise: Promise) {
    val permissionsManager = mModuleRegistry!!.getModule(Permissions::class.java)
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?")
      return
    }
    if (permissionsManager.isPermissionPresentInManifest(Manifest.permission.WRITE_CONTACTS)) {
      permissionsManager.askForPermissionsWithPromise(promise, Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS)
    } else {
      permissionsManager.askForPermissionsWithPromise(promise, Manifest.permission.READ_CONTACTS)
    }
  }

  @ExpoMethod
  fun getPermissionsAsync(promise: Promise) {
    val permissionsManager = mModuleRegistry!!.getModule(Permissions::class.java)
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?")
      return
    }
    if (permissionsManager.isPermissionPresentInManifest(Manifest.permission.WRITE_CONTACTS)) {
      permissionsManager.getPermissionsWithPromise(promise, Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS)
    } else {
      permissionsManager.getPermissionsWithPromise(promise, Manifest.permission.READ_CONTACTS)
    }
  }

  // TODO: Evan: Test
  @ExpoMethod
  fun getContactsAsync(options: Map<String?, Any?>, promise: Promise) {
    if (isMissingReadPermission(promise)) return
    Thread(Runnable {
      var sortOrder: String? = null
      if (options.containsKey("sort") && options["sort"] is String) {
        sortOrder = options["sort"] as String?
      }
      var fields: ArrayList<*>? = null
      if (options.containsKey("fields") && options["fields"] is ArrayList<*>) {
        fields = options["fields"] as ArrayList<*>?
      }
      val keysToFetch = getFieldsSet(fields)
      if (options.containsKey("id") && options["id"] is String) {
        val contact = getContactById(options["id"] as String?, keysToFetch, promise)
        val output = Bundle()
        if (contact != null) {
          val contacts: MutableCollection<*> = ArrayList<Any?>()
          contacts.add(contact)
          val data = serializeContacts(contacts, keysToFetch, promise) ?: return@Runnable
          output.putParcelableArrayList("data", data)
        } else {
          output.putParcelableArray("data", arrayOfNulls(0))
        }
        output.putBoolean("hasNextPage", false)
        output.putBoolean("hasPreviousPage", false)
        promise.resolve(output)
      } else if (options.containsKey("name") && options["name"] is String) {
        val predicateMatchingName = "%" + options["name"] as String? + "%"
        val contactData = getContactByName(predicateMatchingName, keysToFetch, sortOrder,
            promise)
        val contacts = contactData!!["data"] as Collection<Contact>?
        val data = serializeContacts(contacts, keysToFetch, promise) ?: return@Runnable
        val output = Bundle()
        output.putParcelableArrayList("data", data)
        output.putBoolean("hasNextPage", (contactData["hasNextPage"] as Boolean?)!!)
        output.putBoolean("hasPreviousPage", (contactData["hasPreviousPage"] as Boolean?)!!)
        promise.resolve(output)
      } else {
        getAllContactsAsync(options, keysToFetch, sortOrder, promise)
      }
    }).start()
  }

  @ExpoMethod
  fun addContactAsync(data: Map<String, Any>, containerId: String?, promise: Promise) {
    if (isMissingReadPermission(promise) || isMissingWritePermission(promise)) return
    val contact = mutateContact(null, data)
    val ops = contact.toInsertOperationList()
    try {
      val result = resolver.applyBatch(ContactsContract.AUTHORITY, ops)
      if (result.size > 0) {
        resolver.query(result[0].uri!!, arrayOf(ContactsContract.RawContacts.CONTACT_ID), null, null, null).use { cursor ->
          if (cursor == null) {
            promise.reject("E_ADD_CONTACT_FAILED", "Couldn't get the contact id.")
            return
          }
          cursor.moveToNext()
          promise.resolve(cursor.getLong(0).toString())
        }
      } else {
        promise.reject("E_ADD_CONTACT_FAILED", "Given contact couldn't be added.")
      }
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  // TODO: Evan: Test
  @ExpoMethod
  fun updateContactAsync(contact: Map<String, Any>, promise: Promise) {
    if (isMissingReadPermission(promise) || isMissingWritePermission(promise)) return
    val id = if (contact.containsKey("id")) contact["id"] as String? else null
    val keysToFetch = getFieldsSet(null)
    var targetContact = getContactById(id, keysToFetch, promise)
    if (targetContact != null) {
      targetContact = mutateContact(targetContact, contact)
      val ops = targetContact.toUpdateOperationList()
      try {
        val result = resolver.applyBatch(ContactsContract.AUTHORITY, ops)
        if (result.size > 0) {
          promise.resolve(id)
        } else {
          promise.reject("E_UPDATE_CONTACT_FAILED", "Given contact couldn't be updated.")
        }
      } catch (e: Exception) {
        promise.reject(e)
      }
    } else {
      promise.reject("E_CONTACTS", "Couldn't find contact")
    }
  }

  @ExpoMethod
  fun removeContactAsync(contactId: String?, promise: Promise) {
    if (isMissingReadPermission(promise) || isMissingWritePermission(promise)) return
    val uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_URI, contactId)
    try {
      resolver.delete(uri, null, null)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun shareContactAsync(contactId: String?, subject: String?, promise: Promise) {
    val lookupKey = getLookupKeyForContactId(contactId)
    if (lookupKey == null) {
      promise.reject("E_CONTACTS", "Couldn't find lookup key for contact.")
    }
    val uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_VCARD_URI, lookupKey)
    val intent = Intent(Intent.ACTION_SEND)
    intent.type = ContactsContract.Contacts.CONTENT_VCARD_TYPE
    intent.putExtra(Intent.EXTRA_STREAM, uri)
    intent.putExtra(Intent.EXTRA_SUBJECT, subject)
    val activityProvider = mModuleRegistry!!.getModule(ActivityProvider::class.java)
    activityProvider.currentActivity.startActivity(intent)
  }

  @ExpoMethod
  fun writeContactToFileAsync(contact: Map<String?, Any?>, promise: Promise) {
    if (isMissingReadPermission(promise)) return
    val id = if (contact.containsKey("id")) contact["id"] as String? else null
    val lookupKey = getLookupKeyForContactId(id)
    if (lookupKey == null) {
      promise.reject("E_CONTACTS", "Couldn't find lookup key for contact.")
    }
    val uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_VCARD_URI, lookupKey)
    promise.resolve(uri.toString())
  }

  @ExpoMethod
  fun presentFormAsync(contactId: String?, contactData: Map<String, Any>, options: Map<String?, Any?>?, promise: Promise) {
    if (isMissingReadPermission(promise)) return
    if (contactId != null) {
      val keysToFetch = getFieldsSet(null)
      val contact = getContactById(contactId, keysToFetch, promise)
      if (contact == null) {
        promise.reject("E_CONTACTS", "Couldn't find contact with ID.")
        return
      }
      // contact = mutateContact(contact, contactData);
      presentEditForm(contact, promise)
      return
    }
    // Create contact from supplied data.
    val contact = mutateContact(null, contactData)
    presentForm(contact)
  }

  private fun presentForm(contact: Contact) {
    val intent = Intent(Intent.ACTION_INSERT, ContactsContract.Contacts.CONTENT_URI)
    intent.putExtra(ContactsContract.Intents.Insert.NAME, contact.getDisplayName())
    intent.putParcelableArrayListExtra(ContactsContract.Intents.Insert.DATA, contact.contentValues)
    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    val activityProvider = mModuleRegistry!!.getModule(ActivityProvider::class.java)
    activityProvider.currentActivity.startActivity(intent)
  }

  private fun presentEditForm(contact: Contact, promise: Promise) {
    val selectedContactUri = ContactsContract.Contacts.getLookupUri(contact.contactId.toLong(),
        contact.lookupKey)
    val intent = Intent(Intent.ACTION_EDIT)
    intent.setDataAndType(selectedContactUri, ContactsContract.Contacts.CONTENT_ITEM_TYPE)
    val activityProvider = mModuleRegistry!!.getModule(ActivityProvider::class.java)
    mPendingPromise = promise
    activityProvider.currentActivity.startActivityForResult(intent, RC_EDIT_CONTACT)
  }

  // TODO: Evan: WIP - Not for SDK 29
  @ExpoMethod
  fun getContactByPhoneNumber(phoneNumber: String?, promise: Promise) {
    if (isMissingReadPermission(promise)) return

    // TODO: Replace this with new format
    AsyncTask.execute(Runnable {
      val contact = Bundle()
      val uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(phoneNumber))
      val projection = arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME)
      val cursor = resolver.query(uri, projection, null, null, null)
      if (cursor == null) {
        promise.reject("E_CONTACTS", "Couldn't query contact by number")
        return@Runnable
      }
      try {
        if (cursor.moveToFirst()) {
          val name = cursor.getString(cursor.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME))
          contact.putString("displayName", name)
        }
      } catch (e: Exception) {
        promise.reject(e)
      } finally {
        if (!cursor.isClosed) {
          cursor.close()
        }
      }
      promise.resolve(contact)
    })
  }

  private val resolver: ContentResolver
    private get() = context.contentResolver

  //TODO: Evan: Add nickname and maidenName to .NickName
  private fun mutateContact(contact: Contact?, data: Map<String, Any>): Contact {
    var contact = contact
    if (contact == null) {
      contact = Contact(UUID.randomUUID().toString())
    }
    if (data.containsKey("firstName")) contact.firstName = data["firstName"] as String?
    if (data.containsKey("middleName")) contact.middleName = data["middleName"] as String?
    if (data.containsKey("lastName")) contact.lastName = data["lastName"] as String?
    if (data.containsKey("namePrefix")) contact.prefix = data["namePrefix"] as String?
    if (data.containsKey("nameSuffix")) contact.suffix = data["nameSuffix"] as String?
    if (data.containsKey("phoneticFirstName")) contact.phoneticFirstName = data["phoneticFirstName"] as String?
    if (data.containsKey("phoneticMiddleName")) contact.phoneticMiddleName = data["phoneticMiddleName"] as String?
    if (data.containsKey("phoneticLastName")) contact.phoneticLastName = data["phoneticLastName"] as String?
    if (data.containsKey("company")) contact.company = data["company"] as String?
    if (data.containsKey("jobTitle")) contact.jobTitle = data["jobTitle"] as String?
    if (data.containsKey("department")) contact.department = data["department"] as String?
    if (data.containsKey("note")) contact.note = data["note"] as String?
    if (data.containsKey("image")) {
      if (data["image"] is String) {
        contact.photoUri = data["image"] as String?
        contact.hasPhoto = true
      } else if (data["image"] is Map<*, *>) {
        val photo = data["image"] as Map<String, Any>?
        if (photo!!.containsKey("uri")) {
          contact.photoUri = photo["uri"] as String?
          contact.hasPhoto = true
        }
      }
    }
    var results: ArrayList<*>?
    try {
      results = BaseModel.decodeList(if (data.containsKey("addresses")) data["addresses"] as List<*>? else null,
          PostalAddressModel::class.java)
      if (results != null) contact.addresses = results
      results = BaseModel.decodeList(if (data.containsKey("phoneNumbers")) data["phoneNumbers"] as List<*>? else null,
          PhoneNumberModel::class.java)
      if (results != null) contact.phones = results
      results = BaseModel.decodeList(if (data.containsKey("emails")) data["emails"] as List<*>? else null, EmailModel::class.java)
      if (results != null) contact.emails = results
      results = BaseModel.decodeList(if (data.containsKey("instantMessageAddresses")) data["instantMessageAddresses"] as List<*>? else null,
          ImAddressModel::class.java)
      if (results != null) contact.imAddresses = results
      results = BaseModel.decodeList(if (data.containsKey("urlAddresses")) data["urlAddresses"] as List<*>? else null,
          UrlAddressModel::class.java)
      if (results != null) contact.urlAddresses = results
      results = BaseModel.decodeList(if (data.containsKey("extraNames")) data["extraNames"] as List<*>? else null, ExtraNameModel::class.java)
      if (results != null) contact.extraNames = results
      results = BaseModel.decodeList(if (data.containsKey("dates")) data["dates"] as List<*>? else null, DateModel::class.java)
      if (results != null) contact.dates = results
      results = BaseModel.decodeList(if (data.containsKey("relationships")) data["relationships"] as List<*>? else null,
          RelationshipModel::class.java)
      if (results != null) contact.relationships = results
    } catch (e: Exception) {
      // promise.reject(e);
    }
    return contact
  }

  private fun getLookupKeyForContactId(contactId: String?): String? {
    val cur = resolver.query(ContactsContract.Contacts.CONTENT_URI, arrayOf(ContactsContract.Contacts.LOOKUP_KEY),
        ContactsContract.Contacts._ID + " = " + contactId, null, null)
    return if (cur!!.moveToFirst()) {
      cur.getString(0)
    } else null
  }

  private fun getContactById(contactId: String?, keysToFetch: Set<String>, promise: Promise): Contact? {
    val queryMap = createProjectionForQuery(keysToFetch)
    val projection = queryMap["projection"] as List<String>?
    val selection = queryMap["selection"] as String?
    val selectionArgs = queryMap["selectionArgs"] as ArrayList<String>?
    val cursorProjection = projection!!.toTypedArray()
    val cursorSelection = ContactsContract.Data.CONTACT_ID + " = ?"
    val cursorSortOrder: String? = null
    val cursor = resolver.query(
        ContactsContract.Data.CONTENT_URI,
        cursorProjection,
        cursorSelection,
        arrayOf(contactId),
        cursorSortOrder
    )
    if (cursor != null) {
      try {
        val contacts = loadContactsFrom(cursor)
        val contactList = ArrayList(contacts.values)
        if (contactList.size > 0) {
          return contactList[0]
        }
      } catch (e: Exception) {
        promise.reject(e)
      } finally {
        cursor.close()
      }
    }
    return null
  }

  private fun serializeContacts(contacts: Collection<Contact>?, keysToFetch: Set<String>, promise: Promise): ArrayList<*>? {
    if (contacts == null) return null
    val contactsArray: ArrayList<*> = ArrayList<Any?>()
    try {
      for (contact in contacts) {
        contactsArray.add(contact.toMap(keysToFetch))
      }
    } catch (e: Exception) {
      promise.reject(e)
    }
    return contactsArray
  }

  private fun getContactByName(query: String, keysToFetch: Set<String>, sortOrder: String?,
                               promise: Promise): HashMap<String, Any>? {
    return fetchContacts(0, 9999, arrayOf(query), ContactsContract.Data.DISPLAY_NAME_PRIMARY, keysToFetch, sortOrder, promise)
  }

  private fun ensureFieldsSet(fieldsSet: Set<String>?): Set<String> {
    return fieldsSet
        ?: newHashSet("phoneNumbers", "emails", "addresses", "note", "birthday", "dates", "instantMessageAddresses",
            "urlAddresses", "extraNames", "relationships", "phoneticFirstName", "phoneticLastName", "phoneticMiddleName",
            "namePrefix", "nameSuffix", "name", "firstName", "middleName", "lastName", "nickname", "id", "jobTitle",
            "company", "department", "image", "imageAvailable", "note")
  }

  private fun convertReadableArray(fields: ArrayList<*>): Set<String> {
    val fieldStrings: MutableSet<String> = HashSet()
    for (key in fields) {
      if (key is String) {
        fieldStrings.add(key)
      }
    }
    return fieldStrings
  }

  private fun getFieldsSet(fields: ArrayList<*>?): Set<String> {
    return if (fields != null) {
      val fieldStrings = convertReadableArray(fields)
      ensureFieldsSet(fieldStrings)
    } else {
      ensureFieldsSet(null)
    }
  }

  private fun getAllContactsAsync(options: Map<String?, Any?>, keysToFetch: Set<String>, sortOrder: String?,
                                  promise: Promise) {
    var pageOffset = 0
    if (options.containsKey("pageOffset") && options["pageOffset"] is Number) {
      pageOffset = (options["pageOffset"] as Number?)!!.toInt()
    }
    var pageSize = 0
    if (options.containsKey("pageSize") && options["pageSize"] is Number) {
      pageSize = (options["pageSize"] as Number?)!!.toInt()
    }
    val contactsData = fetchContacts(pageOffset, pageSize, null, null, keysToFetch, sortOrder,
        promise)
    if (contactsData != null) {
      val contacts = contactsData["data"] as ArrayList<Contact>?
      val contactsArray: ArrayList<*> = ArrayList<Any?>()
      try {
        for (contact in contacts!!) {
          contactsArray.add(contact.toMap(keysToFetch))
        }
        val output = Bundle()
        output.putBoolean("hasNextPage", (contactsData["hasNextPage"] as Boolean?)!!)
        output.putBoolean("hasPreviousPage", (contactsData["hasPreviousPage"] as Boolean?)!!)
        output.putParcelableArrayList("data", contactsArray)
        output.putInt("total", (contactsData["total"] as Int?)!!)
        promise.resolve(output)
      } catch (e: Exception) {
        promise.reject(e)
      }
    }
  }

  private fun createProjectionForQuery(keysToFetch: Set<String>): HashMap<*, *> {
    val projection: MutableList<String> = ArrayList(DEFAULT_PROJECTION)
    val selectionArgs = ArrayList(Arrays.asList(CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE,
        CommonDataKinds.Organization.CONTENT_ITEM_TYPE))

    // selection ORs need to match arg count from above selectionArgs
    var selection = EXColumns.MIMETYPE + "=? OR " + ContactsContract.Data.MIMETYPE + "=?"

    // handle "add on" fields from query request
    if (keysToFetch.contains("phoneNumbers")) {
      projection.add(CommonDataKinds.Phone.NUMBER)
      projection.add(CommonDataKinds.Phone.TYPE)
      projection.add(CommonDataKinds.Phone.LABEL)
      projection.add(CommonDataKinds.Phone.IS_PRIMARY)
      projection.add(CommonDataKinds.Phone._ID)
      selection += " OR " + EXColumns.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Phone.CONTENT_ITEM_TYPE)
    }
    if (keysToFetch.contains("emails")) {
      projection.add(CommonDataKinds.Email.DATA)
      projection.add(CommonDataKinds.Email.ADDRESS)
      projection.add(CommonDataKinds.Email.TYPE)
      projection.add(CommonDataKinds.Email.LABEL)
      projection.add(CommonDataKinds.Email.IS_PRIMARY)
      projection.add(CommonDataKinds.Email._ID)
      selection += " OR " + EXColumns.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Email.CONTENT_ITEM_TYPE)
    }
    if (keysToFetch.contains("addresses")) {
      projection.add(CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS)
      projection.add(CommonDataKinds.StructuredPostal.TYPE)
      projection.add(CommonDataKinds.StructuredPostal.LABEL)
      projection.add(CommonDataKinds.StructuredPostal.STREET)
      projection.add(CommonDataKinds.StructuredPostal.POBOX)
      projection.add(CommonDataKinds.StructuredPostal.NEIGHBORHOOD)
      projection.add(CommonDataKinds.StructuredPostal.CITY)
      projection.add(CommonDataKinds.StructuredPostal.REGION)
      projection.add(CommonDataKinds.StructuredPostal.POSTCODE)
      projection.add(CommonDataKinds.StructuredPostal.COUNTRY)
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE)
    }
    if (keysToFetch.contains("note")) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Note.CONTENT_ITEM_TYPE)
    }
    if (keysToFetch.contains("birthday") || keysToFetch.contains("dates")) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Event.CONTENT_ITEM_TYPE)
    }
    if (keysToFetch.contains("instantMessageAddresses")) {
      projection.add(CommonDataKinds.Im.DATA)
      projection.add(CommonDataKinds.Im.TYPE)
      projection.add(CommonDataKinds.Im.PROTOCOL)
      projection.add(CommonDataKinds.Im._ID)
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Im.CONTENT_ITEM_TYPE)
    }
    if (keysToFetch.contains("urlAddresses")) {
      projection.add(CommonDataKinds.Website.URL)
      projection.add(CommonDataKinds.Website.TYPE)
      projection.add(CommonDataKinds.Website._ID)
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Website.CONTENT_ITEM_TYPE)
    }
    if (keysToFetch.contains("extraNames")) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Nickname.CONTENT_ITEM_TYPE)
    }
    if (keysToFetch.contains("relationships")) {
      projection.add(CommonDataKinds.Relation.NAME)
      projection.add(CommonDataKinds.Relation.TYPE)
      projection.add(CommonDataKinds.Relation._ID)
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Relation.CONTENT_ITEM_TYPE)
    }
    if (keysToFetch.contains("phoneticFirstName")) projection.add(CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME)
    if (keysToFetch.contains("phoneticLastName")) projection.add(CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME)
    if (keysToFetch.contains("phoneticMiddleName")) projection.add(CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME)
    if (keysToFetch.contains("namePrefix")) projection.add(CommonDataKinds.StructuredName.PREFIX)
    if (keysToFetch.contains("nameSuffix")) projection.add(CommonDataKinds.StructuredName.SUFFIX)
    val map: HashMap<*, *> = HashMap<Any?, Any?>()
    map["projection"] = projection
    map["selection"] = selection
    map["selectionArgs"] = selectionArgs
    return map
  }

  private fun fetchContacts(pageOffset: Int, pageSize: Int, queryStrings: Array<String>?, queryField: String?,
                            keysToFetch: Set<String>, sortOrder: String?, promise: Promise): HashMap<String, Any>? {
    var queryField = queryField
    val getAll = pageSize == 0
    queryField = queryField ?: ContactsContract.Data.CONTACT_ID
    val queryMap = createProjectionForQuery(keysToFetch)
    val projection = queryMap["projection"] as List<String>?
    // selection ORs need to match arg count from above selectionArgs
    val selection = queryMap["selection"] as String?
    val contacts: Map<String, Contact>
    val cr = resolver
    val cursor: Cursor?
    val selectionArgs = queryMap["selectionArgs"] as ArrayList<String>?
    val cursorSortOrder: String? = null
    cursor = if (queryStrings != null && queryStrings.size > 0) {
      val cursorProjection = projection!!.toTypedArray()
      val cursorSelection = "$queryField LIKE ?"
      cr.query(
          ContactsContract.Data.CONTENT_URI,
          cursorProjection,
          cursorSelection,
          queryStrings,
          cursorSortOrder)
    } else {
      cr.query(
          ContactsContract.Data.CONTENT_URI,
          projection!!.toTypedArray(),
          selection,
          selectionArgs!!.toTypedArray(),
          cursorSortOrder)
    }
    if (cursor != null) {
      try {
        contacts = loadContactsFrom(cursor)
        val contactsArray: ArrayList<*> = ArrayList<Any?>()

        // introduce paging at this level to ensure all data elements
        // are appropriately mapped to contacts from cursor
        // NOTE: paging performance improvement is minimized as cursor iterations will
        // always fully run
        var currentIndex: Int
        var contactList = ArrayList(contacts.values)
        contactList = sortContactsBy(contactList, sortOrder)
        val contactListSize = contactList.size
        val response = HashMap<String, Any>()

        // convert from contact pojo to react native
        currentIndex = if (getAll) 0 else pageOffset
        while (currentIndex < contactListSize) {
          val contact = contactList[currentIndex]

          // if fetching single contact, short circuit and return contact
          if (!getAll && currentIndex - pageOffset >= pageSize) {
            break
          }
          contactsArray.add(contact)
          currentIndex++
        }
        response["data"] = contactsArray
        response["hasPreviousPage"] = pageOffset > 0
        response["hasNextPage"] = pageOffset + pageSize < contactListSize
        response["total"] = contactListSize
        return response
      } catch (e: Exception) {
        promise.reject(e)
      } finally {
        cursor.close()
      }
    }
    return null
  }

  private fun sortContactsBy(input: ArrayList<Contact>, sortOrder: String?): ArrayList<Contact> {
    return if (sortOrder == null) input else when (sortOrder) {
      "firstName" -> {
        Collections.sort(input) { p1, p2 -> p1.getFirstName().compareTo(p2.getFirstName(), ignoreCase = true) }
        input
      }
      "lastName" -> {
        Collections.sort(input) { p1, p2 -> p1.getLastName().compareTo(p2.getLastName(), ignoreCase = true) }
        input
      }
      else -> input
    }
  }

  private fun loadContactsFrom(cursor: Cursor): Map<String, Contact> {
    val map: MutableMap<String, Contact> = LinkedHashMap()
    while (cursor.moveToNext()) {
      val columnIndex = cursor.getColumnIndex(ContactsContract.Data.CONTACT_ID)
      val contactId = cursor.getString(columnIndex)

      // add or update existing contact for iterating data based on contact id
      if (!map.containsKey(contactId)) {
        map[contactId] = Contact(contactId)
      }
      val contact = map[contactId]
      contact!!.fromCursor(cursor)
    }
    return map
  }

  private fun isMissingReadPermission(promise: Promise): Boolean {
    val permissionsManager = mModuleRegistry!!.getModule(Permissions::class.java)
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?")
      return false
    }
    val hasPermission = permissionsManager.hasGrantedPermissions(Manifest.permission.READ_CONTACTS)
    if (!hasPermission) {
      promise.reject("E_MISSING_PERMISSION", "Missing read contacts permission.")
    }
    return !hasPermission
  }

  private fun isMissingWritePermission(promise: Promise): Boolean {
    val permissionsManager = mModuleRegistry!!.getModule(Permissions::class.java)
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?")
      return false
    }
    val hasPermission = permissionsManager.hasGrantedPermissions(Manifest.permission.WRITE_CONTACTS)
    if (!hasPermission) {
      promise.reject("E_MISSING_PERMISSION", "Missing write contacts permission.")
    }
    return !hasPermission
  }

  private inner class ContactsActivityEventListener : ActivityEventListener {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, intent: Intent?) {
      if (requestCode == RC_EDIT_CONTACT && mPendingPromise != null) {
        mPendingPromise!!.resolve(0)
      }
    }

    override fun onNewIntent(intent: Intent) {
      // do nothing
    }
  }

  companion object {
    const val RC_EDIT_CONTACT = 2137
    private val TAG = ContactsModule::class.java.simpleName

    // TODO: Evan: default API is confusing. Duplicate data being requested.
    private val DEFAULT_PROJECTION: List<String> = object : ArrayList<String?>() {
      init {
        add(ContactsContract.Data.RAW_CONTACT_ID)
        add(ContactsContract.Data.CONTACT_ID)
        add(ContactsContract.Data.LOOKUP_KEY)
        add(ContactsContract.Contacts.Data.MIMETYPE)
        add(ContactsContract.Profile.DISPLAY_NAME)
        add(CommonDataKinds.Contactables.PHOTO_URI)
        add(CommonDataKinds.Contactables.PHOTO_THUMBNAIL_URI)
        add(CommonDataKinds.StructuredName.DISPLAY_NAME)
        add(CommonDataKinds.StructuredName.GIVEN_NAME)
        add(CommonDataKinds.StructuredName.MIDDLE_NAME)
        add(CommonDataKinds.StructuredName.FAMILY_NAME)
        add(CommonDataKinds.StructuredName.PREFIX)
        add(CommonDataKinds.StructuredName.SUFFIX)
        add(CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME)
        add(CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME)
        add(CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME)
        add(CommonDataKinds.Organization.COMPANY)
        add(CommonDataKinds.Organization.TITLE)
        add(CommonDataKinds.Organization.DEPARTMENT)
      }
    }

    private fun newHashSet(vararg strings: String): Set<String> {
      val set = HashSet<String>()
      for (s in strings) {
        set.add(s)
      }
      return set
    }
  }
}
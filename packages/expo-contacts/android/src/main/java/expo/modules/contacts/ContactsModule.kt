package expo.modules.contacts

import android.Manifest
import android.provider.ContactsContract.CommonDataKinds
import android.app.Activity
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.os.Bundle
import android.provider.ContactsContract
import android.content.Intent
import android.os.AsyncTask
import android.content.ContentResolver

import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.Promise
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.services.UIManager
import expo.modules.contacts.models.PostalAddressModel
import expo.modules.contacts.models.PhoneNumberModel
import expo.modules.contacts.models.EmailModel
import expo.modules.contacts.models.ImAddressModel
import expo.modules.contacts.models.UrlAddressModel
import expo.modules.contacts.models.ExtraNameModel
import expo.modules.contacts.models.DateModel
import expo.modules.contacts.models.RelationshipModel
import expo.modules.contacts.models.BaseModel
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.interfaces.permissions.Permissions

import java.lang.Exception
import java.util.*

const val RC_EDIT_CONTACT = 2137
private val TAG = ContactsModule::class.java.simpleName

// TODO: Evan: default API is confusing. Duplicate data being requested.
private val DEFAULT_PROJECTION: List<String> = listOf(
  ContactsContract.Data.RAW_CONTACT_ID,
  ContactsContract.Data.CONTACT_ID,
  ContactsContract.Data.LOOKUP_KEY,
  ContactsContract.Contacts.Data.MIMETYPE,
  ContactsContract.Profile.DISPLAY_NAME,
  CommonDataKinds.Contactables.PHOTO_URI,
  CommonDataKinds.Contactables.PHOTO_THUMBNAIL_URI,
  CommonDataKinds.StructuredName.DISPLAY_NAME,
  CommonDataKinds.StructuredName.GIVEN_NAME,
  CommonDataKinds.StructuredName.MIDDLE_NAME,
  CommonDataKinds.StructuredName.FAMILY_NAME,
  CommonDataKinds.StructuredName.PREFIX,
  CommonDataKinds.StructuredName.SUFFIX,
  CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME,
  CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME,
  CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME,
  CommonDataKinds.Organization.COMPANY,
  CommonDataKinds.Organization.TITLE,
  CommonDataKinds.Organization.DEPARTMENT
)

class ContactsModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context) {
  private val activityEventListener = ContactsActivityEventListener()
  private val permissionsManager: Permissions by moduleRegistry()
  private val activityProvider: ActivityProvider by moduleRegistry()
  private var pendingPromise: Promise? = null

  override fun getName() = "ExpoContacts"

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
    val uiManager: UIManager by moduleRegistry()
    uiManager.registerActivityEventListener(activityEventListener)
  }

  @ExpoMethod
  fun requestPermissionsAsync(promise: Promise) {
    if (permissionsManager.isPermissionPresentInManifest(Manifest.permission.WRITE_CONTACTS)) {
      permissionsManager.askForPermissionsWithPromise(promise, Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS)
    } else {
      permissionsManager.askForPermissionsWithPromise(promise, Manifest.permission.READ_CONTACTS)
    }
  }

  @ExpoMethod
  fun getPermissionsAsync(promise: Promise) {
    if (permissionsManager.isPermissionPresentInManifest(Manifest.permission.WRITE_CONTACTS)) {
      permissionsManager.getPermissionsWithPromise(promise, Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS)
    } else {
      permissionsManager.getPermissionsWithPromise(promise, Manifest.permission.READ_CONTACTS)
    }
  }

  // TODO: Evan: Test
  @ExpoMethod
  fun getContactsAsync(options: Map<String, Any?>, promise: Promise) {
    if (isMissingReadPermission(promise)) return

    Thread(
      Runnable {
        val sortOrder: String? = options["sort"] as? String
        val fields: ArrayList<*>? = options["fields"] as? ArrayList<*>

        val keysToFetch = getFieldsSet(fields)

        if (options.containsKey("id") && options["id"] is String) {
          val output = Bundle()
          val contact = getContactById(options["id"] as String, keysToFetch, promise)
          if (contact != null) {
            val contacts = arrayListOf(contact)
            val data = serializeContacts(contacts, keysToFetch, promise) ?: return@Runnable
            output.putParcelableArrayList("data", data)
          } else {
            output.putParcelableArray("data", arrayOfNulls(0))
          }
          output.putBoolean("hasNextPage", false)
          output.putBoolean("hasPreviousPage", false)
          promise.resolve(output)
        } else if (options.containsKey("name") && options["name"] is String) {
          val predicateMatchingName = "%" + options["name"] as String + "%"
          val contactData = getContactByName(predicateMatchingName, keysToFetch, sortOrder, promise)
          val contacts = contactData!!["data"] as Collection<Contact>? // TODO
          val data = serializeContacts(contacts, keysToFetch, promise) ?: return@Runnable
          val output = Bundle().apply {
            putParcelableArrayList("data", data)
            putBoolean("hasNextPage", (contactData["hasNextPage"] as Boolean?)!!) // TODO
            putBoolean("hasPreviousPage", (contactData["hasPreviousPage"] as Boolean?)!!) // TODO
          }
          promise.resolve(output)
        } else {
          getAllContactsAsync(options, keysToFetch, sortOrder, promise)
        }
      }
    ).start()
  }

  @ExpoMethod
  fun addContactAsync(data: Map<String, Any>, containerId: String?, promise: Promise) {
    if (isMissingReadPermission(promise) || isMissingWritePermission(promise)) return
    val contact = mutateContact(null, data)
    val ops = contact.toInsertOperationList()
    try {
      val result = resolver.applyBatch(ContactsContract.AUTHORITY, ops)
      if (result.isNotEmpty()) {
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
        if (result.isNotEmpty()) {
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
  fun removeContactAsync(contactId: String, promise: Promise) {
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
    val intent = Intent(Intent.ACTION_SEND).apply {
      type = ContactsContract.Contacts.CONTENT_VCARD_TYPE
      putExtra(Intent.EXTRA_STREAM, uri)
      putExtra(Intent.EXTRA_SUBJECT, subject)
    }
    activityProvider.currentActivity.startActivity(intent)
  }

  @ExpoMethod
  fun writeContactToFileAsync(contact: Map<String?, Any?>, promise: Promise) {
    if (isMissingReadPermission(promise)) return
    val id = contact["id"] as? String
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
    val intent = Intent(Intent.ACTION_INSERT, ContactsContract.Contacts.CONTENT_URI).apply {
      putExtra(ContactsContract.Intents.Insert.NAME, contact.getDisplayName())
      putParcelableArrayListExtra(ContactsContract.Intents.Insert.DATA, contact.contentValues)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
    activityProvider.currentActivity.startActivity(intent)
  }

  private fun presentEditForm(contact: Contact, promise: Promise) {
    val selectedContactUri = ContactsContract.Contacts.getLookupUri(
      contact.contactId.toLong(),
      contact.lookupKey
    )
    val intent = Intent(Intent.ACTION_EDIT).apply {
      setDataAndType(selectedContactUri, ContactsContract.Contacts.CONTENT_ITEM_TYPE)
    }
    pendingPromise = promise
    activityProvider.currentActivity.startActivityForResult(intent, RC_EDIT_CONTACT)
  }

  // TODO: Evan: WIP - Not for SDK 29
  @ExpoMethod
  fun getContactByPhoneNumber(phoneNumber: String?, promise: Promise) {
    if (isMissingReadPermission(promise)) return

    // TODO: Replace this with new format
    AsyncTask.execute(
      Runnable {
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
      }
    )
  }

  private val resolver: ContentResolver
    get() = context.contentResolver

  // TODO: Evan: Add nickname and maidenName to .NickName
  private fun mutateContact(contact: Contact?, data: Map<String, Any>): Contact {
    val contact = contact ?: Contact(UUID.randomUUID().toString())
    contact.apply {
      data["firstName"].takeIfInstanceOf<String>()?.let { firstName = it }
      data["middleName"].takeIfInstanceOf<String>()?.let { middleName = it }
      data["lastName"].takeIfInstanceOf<String>()?.let { lastName = it }
      data["namePrefix"].takeIfInstanceOf<String>()?.let { prefix = it }
      data["nameSuffix"].takeIfInstanceOf<String>()?.let { suffix = it }
      data["phoneticFirstName"].takeIfInstanceOf<String>()?.let { phoneticFirstName = it }
      data["phoneticMiddleName"].takeIfInstanceOf<String>()?.let { phoneticMiddleName = it }
      data["phoneticLastName"].takeIfInstanceOf<String>()?.let { phoneticLastName = it }
      data["company"].takeIfInstanceOf<String>()?.let { company = it }
      data["jobTitle"].takeIfInstanceOf<String>()?.let { jobTitle = it }
      data["department"].takeIfInstanceOf<String>()?.let { department = it }
      data["note"].takeIfInstanceOf<String>()?.let { note = it }
      data["image"].takeIfInstanceOf<Any>()?.let {
        if (it is String) {
          photoUri = it
          hasPhoto = true
        } else if (it is Map<*, *>) {
          it["uri"].takeIfInstanceOf<String>()?.let { uri ->
            photoUri = uri
            hasPhoto = true
          }
        }
      }
    }

    try {
      contact.apply {
        getResults<PostalAddressModel>(data, "addresses")?.let { addresses = it }
        getResults<PhoneNumberModel>(data, "phoneNumbers")?.let { phones = it }
        getResults<EmailModel>(data, "emails")?.let { emails = it }
        getResults<ImAddressModel>(data, "instantMessageAddresses")?.let { imAddresses = it }
        getResults<UrlAddressModel>(data, "urlAddresses")?.let { urlAddresses = it }
        getResults<ExtraNameModel>(data, "extraNames")?.let { extraNames = it }
        getResults<DateModel>(data, "dates")?.let { dates = it }
        getResults<RelationshipModel>(data, "relationships")?.let { relationships = it }
      }
    } catch (e: Exception) {
      // promise.reject(e);
    }
    return contact
  }

  private inline fun <reified T> getResults(data: Map<String, Any>, key: String) =
    BaseModel.decodeList(data[key] as? List<*>, T::class.java)

  private inline fun <reified T> Any?.takeIfInstanceOf(): T? = this as? T

  private fun getLookupKeyForContactId(contactId: String?): String? {
    val cursor = resolver.query(
      ContactsContract.Contacts.CONTENT_URI, arrayOf(ContactsContract.Contacts.LOOKUP_KEY),
      ContactsContract.Contacts._ID + " = " + contactId, null, null
    )
    return cursor?.use { cursor ->
      if (cursor.moveToFirst()) cursor.getString(0)
      else null
    }
  }

  private fun getContactById(contactId: String?, keysToFetch: Set<String>, promise: Promise): Contact? {
    val queryMap = createProjectionForQuery(keysToFetch)
    val projection = queryMap["projection"].takeIfInstanceOf<List<String>>()
    val cursor = resolver.query(
      ContactsContract.Data.CONTENT_URI,
      projection!!.toTypedArray(),
      ContactsContract.Data.CONTACT_ID + " = ?",
      arrayOf(contactId),
      null
    )
    cursor?.use {
      try {
        val contacts = loadContactsFrom(cursor)
        val contactList = ArrayList(contacts.values)
        if (contactList.isNotEmpty()) {
          return contactList[0]
        }
      } catch (e: Exception) {
        promise.reject(e)
      }
    }
    return null
  }

  private fun serializeContacts(
    contacts: Collection<Contact>?,
    keysToFetch: Set<String>,
    promise: Promise
  ): ArrayList<Bundle>? {
    if (contacts == null) return null
    return try {
      ArrayList(contacts.map { it.toMap(keysToFetch) })
    } catch (e: Exception) {
      promise.reject(e)
      null
    }
  }

  private fun getContactByName(
    query: String,
    keysToFetch: Set<String>,
    sortOrder: String?,
    promise: Promise
  ): MutableMap<String, Any>? = fetchContacts(
    0,
    9999,
    arrayOf(query),
    ContactsContract.Data.DISPLAY_NAME_PRIMARY,
    keysToFetch,
    sortOrder,
    promise
  )

  private fun ensureFieldsSet(fieldsSet: Set<String>?): Set<String> = fieldsSet
    ?: setOf(
      "phoneNumbers", "emails", "addresses", "note", "birthday", "dates",
      "instantMessageAddresses", "urlAddresses", "extraNames", "relationships", "phoneticFirstName",
      "phoneticLastName", "phoneticMiddleName", "namePrefix", "nameSuffix", "name", "firstName",
      "middleName", "lastName", "nickname", "id", "jobTitle", "company", "department", "image",
      "imageAvailable", "note"
    )

  private fun convertReadableArray(fields: ArrayList<*>): Set<String> =
    fields.filterTo(mutableSetOf()) { it is String } as Set<String>

  private fun getFieldsSet(fields: ArrayList<*>?): Set<String> =
    ensureFieldsSet(fields?.let { convertReadableArray(it) })

  private fun getAllContactsAsync(
    options: Map<String, Any?>,
    keysToFetch: Set<String>,
    sortOrder: String?,
    promise: Promise
  ) {
    val pageOffset = options["pageOffset"].takeIfInstanceOf<Number>()?.toInt() ?: 0
    val pageSize = options["pageSize"].takeIfInstanceOf<Number>()?.toInt() ?: 0
    val contactsData = fetchContacts(
      pageOffset, pageSize, null, null, keysToFetch, sortOrder,
      promise
    )
    if (contactsData != null) {
      val contacts = contactsData["data"] as ArrayList<Contact>?
      val contactsArray = serializeContacts(contacts, keysToFetch, promise)
      val output = Bundle().apply {
        putBoolean("hasNextPage", (contactsData["hasNextPage"] as Boolean))
        putBoolean("hasPreviousPage", (contactsData["hasPreviousPage"] as Boolean))
        putParcelableArrayList("data", contactsArray)
        putInt("total", (contactsData["total"] as Int))
      }
      promise.resolve(output)
    }
  }

  private fun createProjectionForQuery(keysToFetch: Set<String>): MutableMap<String, Any> { // TODO: Check if it has to be a mutable map
    val projection: MutableList<String> = ArrayList(DEFAULT_PROJECTION)
    val selectionArgs = arrayListOf(
      CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE,
      CommonDataKinds.Organization.CONTENT_ITEM_TYPE
    )

    // selection ORs need to match arg count from above selectionArgs
    var selection = EXColumns.MIMETYPE + "=? OR " + ContactsContract.Data.MIMETYPE + "=?"

    // handle "add on" fields from query request
    if ("phoneNumbers" in keysToFetch) {
      projection.addAll(
        listOf(
          CommonDataKinds.Phone.NUMBER,
          CommonDataKinds.Phone.TYPE,
          CommonDataKinds.Phone.LABEL,
          CommonDataKinds.Phone.IS_PRIMARY,
          CommonDataKinds.Phone._ID
        )
      )
      selection += " OR " + EXColumns.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Phone.CONTENT_ITEM_TYPE)
    }
    if ("emails" in keysToFetch) {
      projection.addAll(
        listOf(
          CommonDataKinds.Email.DATA,
          CommonDataKinds.Email.ADDRESS,
          CommonDataKinds.Email.TYPE,
          CommonDataKinds.Email.LABEL,
          CommonDataKinds.Email.IS_PRIMARY,
          CommonDataKinds.Email._ID
        )
      )
      selection += " OR " + EXColumns.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Email.CONTENT_ITEM_TYPE)
    }
    if ("addresses" in keysToFetch) {
      projection.addAll(
        listOf(
          CommonDataKinds.StructuredPostal.FORMATTED_ADDRESS,
          CommonDataKinds.StructuredPostal.TYPE,
          CommonDataKinds.StructuredPostal.LABEL,
          CommonDataKinds.StructuredPostal.STREET,
          CommonDataKinds.StructuredPostal.POBOX,
          CommonDataKinds.StructuredPostal.NEIGHBORHOOD,
          CommonDataKinds.StructuredPostal.CITY,
          CommonDataKinds.StructuredPostal.REGION,
          CommonDataKinds.StructuredPostal.POSTCODE,
          CommonDataKinds.StructuredPostal.COUNTRY
        )
      )
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE)
    }
    if ("note" in keysToFetch) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Note.CONTENT_ITEM_TYPE)
    }
    if ("birthday" in keysToFetch || "dates" in keysToFetch) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Event.CONTENT_ITEM_TYPE)
    }
    if (keysToFetch.contains("instantMessageAddresses")) {
      projection.addAll(
        listOf(
          CommonDataKinds.Im.DATA,
          CommonDataKinds.Im.TYPE,
          CommonDataKinds.Im.PROTOCOL,
          CommonDataKinds.Im._ID
        )
      )
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Im.CONTENT_ITEM_TYPE)
    }
    if ("urlAddresses" in keysToFetch) {
      projection.addAll(
        listOf(
          CommonDataKinds.Website.URL,
          CommonDataKinds.Website.TYPE,
          CommonDataKinds.Website._ID,
        )
      )
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Website.CONTENT_ITEM_TYPE)
    }
    if ("extraNames" in keysToFetch) {
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Nickname.CONTENT_ITEM_TYPE)
    }
    if ("relationships" in keysToFetch) {
      projection.addAll(
        listOf(
          CommonDataKinds.Relation.NAME,
          CommonDataKinds.Relation.TYPE,
          CommonDataKinds.Relation._ID,
        )
      )
      selection += " OR " + ContactsContract.Data.MIMETYPE + "=?"
      selectionArgs.add(CommonDataKinds.Relation.CONTENT_ITEM_TYPE)
    }
    if ("phoneticFirstName" in keysToFetch) projection.add(CommonDataKinds.StructuredName.PHONETIC_GIVEN_NAME)
    if ("phoneticLastName" in keysToFetch) projection.add(CommonDataKinds.StructuredName.PHONETIC_FAMILY_NAME)
    if ("phoneticMiddleName" in keysToFetch) projection.add(CommonDataKinds.StructuredName.PHONETIC_MIDDLE_NAME)
    if ("namePrefix" in keysToFetch) projection.add(CommonDataKinds.StructuredName.PREFIX)
    if ("nameSuffix" in keysToFetch) projection.add(CommonDataKinds.StructuredName.SUFFIX)

    return hashMapOf(
      "projection" to projection,
      "selection" to selection,
      "selectionArgs" to selectionArgs
    )
  }

  private fun fetchContacts(
    pageOffset: Int,
    pageSize: Int,
    queryStrings: Array<String>?,
    queryField: String?,
    keysToFetch: Set<String>,
    sortOrder: String?,
    promise: Promise
  ): MutableMap<String, Any>? { // TODO: Check if it needs to be a mutable map
    val queryField = queryField ?: ContactsContract.Data.CONTACT_ID
    val getAll = pageSize == 0
    val queryMap = createProjectionForQuery(keysToFetch)
    val projection = queryMap["projection"] as List<String>
    // selection ORs need to match arg count from above selectionArgs
    val selection = queryMap["selection"] as String
    val selectionArgs = queryMap["selectionArgs"] as ArrayList<String>
    val cursorSortOrder: String? = null
    val contentResolver = resolver
    val cursor = if (queryStrings != null && queryStrings.isNotEmpty()) {
      val cursorProjection = projection.toTypedArray()
      val cursorSelection = "$queryField LIKE ?"
      contentResolver.query(
        ContactsContract.Data.CONTENT_URI,
        cursorProjection,
        cursorSelection,
        queryStrings,
        cursorSortOrder
      )
    } else {
      contentResolver.query(
        ContactsContract.Data.CONTENT_URI,
        projection.toTypedArray(),
        selection,
        selectionArgs.toTypedArray(),
        cursorSortOrder
      )
    }
    if (cursor != null) {
      try {
        val contacts = loadContactsFrom(cursor)

        // introduce paging at this level to ensure all data elements
        // are appropriately mapped to contacts from cursor
        // NOTE: paging performance improvement is minimized as cursor iterations will
        // always fully run
        val contactList = sortContactsBy(ArrayList(contacts.values), sortOrder)
        val contactListSize = contactList.size

        // convert from contact pojo to react native
        var currentIndex = if (getAll) 0 else pageOffset

        val contactsArray = arrayListOf<Contact>()
        while (currentIndex < contactListSize) {
          val contact = contactList[currentIndex]

          // if fetching single contact, short circuit and return contact
          if (!getAll && currentIndex - pageOffset >= pageSize) {
            break
          }

          contactsArray.add(contact)
          currentIndex++
        }

        return mutableMapOf(
          "data" to contactsArray,
          "hasPreviousPage" to (pageOffset > 0),
          "hasNextPage" to (pageOffset + pageSize < contactListSize),
          "total" to contactListSize
        )
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
        input.sortWith(Comparator { p1, p2 -> p1.getFirstName().compareTo(p2.getFirstName(), ignoreCase = true) })
        input
      }
      "lastName" -> {
        input.sortWith(Comparator { p1, p2 -> p1.getLastName().compareTo(p2.getLastName(), ignoreCase = true) })
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
      if (contactId !in map) {
        map[contactId] = Contact(contactId)
      }
      val contact = map[contactId] as Contact
      contact.fromCursor(cursor)
    }
    return map
  }

  private fun isMissingReadPermission(promise: Promise): Boolean {
    val hasPermission = permissionsManager.hasGrantedPermissions(Manifest.permission.READ_CONTACTS)
    if (!hasPermission) {
      promise.reject("E_MISSING_PERMISSION", "Missing read contacts permission.")
    }
    return !hasPermission
  }

  private fun isMissingWritePermission(promise: Promise): Boolean {
    val hasPermission = permissionsManager.hasGrantedPermissions(Manifest.permission.WRITE_CONTACTS)
    if (!hasPermission) {
      promise.reject("E_MISSING_PERMISSION", "Missing write contacts permission.")
    }
    return !hasPermission
  }

  private inner class ContactsActivityEventListener : ActivityEventListener {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, intent: Intent?) {
      if (requestCode == RC_EDIT_CONTACT && pendingPromise != null) {
        pendingPromise!!.resolve(0)
      }
    }

    override fun onNewIntent(intent: Intent) = Unit
  }
}

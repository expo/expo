package expo.modules.contacts

import android.content.ContentProviderOperation
import android.content.ContentValues
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds
import android.provider.ContactsContract.CommonDataKinds.StructuredName
import android.provider.ContactsContract.RawContacts
import android.text.TextUtils
import android.util.Log
import expo.modules.contacts.models.BaseModel
import expo.modules.contacts.models.DateModel
import expo.modules.contacts.models.EmailModel
import expo.modules.contacts.models.ExtraNameModel
import expo.modules.contacts.models.ImAddressModel
import expo.modules.contacts.models.PhoneNumberModel
import expo.modules.contacts.models.PostalAddressModel
import expo.modules.contacts.models.RelationshipModel
import expo.modules.contacts.models.UrlAddressModel
import java.io.ByteArrayOutputStream
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

// TODO: MaidenName Nickname
class Contact(var contactId: String) {
  private var rawContactId: String? = null
  var lookupKey: String? = null
  private var displayName: String? = null
  var hasPhoto = false
  var photoUri: String? = null
  private var rawPhotoUri: String? = null
  private var contactType = "person"
  var firstName: String? = ""
  var middleName: String? = ""
  var lastName: String? = ""

  var prefix: String? = ""
  var suffix: String? = ""
  var phoneticFirstName: String? = ""
  var phoneticMiddleName: String? = ""
  var phoneticLastName: String? = ""
  var company: String? = ""
  var department: String? = ""
  var jobTitle: String? = ""
  var note: String? = null
  var dates: MutableList<DateModel> = ArrayList()
  var emails: MutableList<EmailModel> = ArrayList()
  var imAddresses: MutableList<ImAddressModel> = ArrayList()
  var phones: MutableList<PhoneNumberModel> = ArrayList()
  var addresses: MutableList<PostalAddressModel> = ArrayList()
  var relationships: MutableList<RelationshipModel> = ArrayList()
  var urlAddresses: MutableList<UrlAddressModel> = ArrayList()
  var extraNames: MutableList<ExtraNameModel> = ArrayList()
  var isFavorite: Boolean = false

  fun fromCursor(cursor: Cursor) {
    rawContactId = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.Data.RAW_CONTACT_ID))
    val mimeType = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.Data.MIMETYPE))
    val name = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.Contacts.DISPLAY_NAME))
    isFavorite = cursor.getInt(cursor.getColumnIndexOrThrow(ContactsContract.Data.STARRED)) == 1
    if (!TextUtils.isEmpty(name) && TextUtils.isEmpty(displayName)) {
      displayName = name
    }
    if (TextUtils.isEmpty(rawPhotoUri)) {
      val rawPhotoURI = cursor.getString(cursor.getColumnIndexOrThrow(Columns.PHOTO_URI))
      if (!TextUtils.isEmpty(rawPhotoURI)) {
        hasPhoto = true
        rawPhotoUri = rawPhotoURI
      }
    }
    if (TextUtils.isEmpty(photoUri)) {
      val rawPhotoURI = cursor.getString(cursor.getColumnIndexOrThrow(Columns.PHOTO_THUMBNAIL_URI))
      if (!TextUtils.isEmpty(rawPhotoURI)) {
        hasPhoto = true
        photoUri = rawPhotoURI
      }
    }
    when (mimeType) {
      StructuredName.CONTENT_ITEM_TYPE -> {
        lookupKey = cursor.getString(cursor.getColumnIndexOrThrow(StructuredName.LOOKUP_KEY))
        firstName = cursor.getString(cursor.getColumnIndexOrThrow(StructuredName.GIVEN_NAME))
        middleName = cursor.getString(cursor.getColumnIndexOrThrow(StructuredName.MIDDLE_NAME))
        lastName = cursor.getString(cursor.getColumnIndexOrThrow(StructuredName.FAMILY_NAME))
        prefix = cursor.getString(cursor.getColumnIndexOrThrow(StructuredName.PREFIX))
        suffix = cursor.getString(cursor.getColumnIndexOrThrow(StructuredName.SUFFIX))
        phoneticFirstName = cursor
          .getString(cursor.getColumnIndexOrThrow(StructuredName.PHONETIC_GIVEN_NAME))
        phoneticMiddleName = cursor
          .getString(cursor.getColumnIndexOrThrow(StructuredName.PHONETIC_MIDDLE_NAME))
        phoneticLastName = cursor
          .getString(cursor.getColumnIndexOrThrow(StructuredName.PHONETIC_FAMILY_NAME))
      }

      CommonDataKinds.Organization.CONTENT_ITEM_TYPE -> {
        company = cursor.getString(cursor.getColumnIndexOrThrow(CommonDataKinds.Organization.COMPANY))
        jobTitle = cursor.getString(cursor.getColumnIndexOrThrow(CommonDataKinds.Organization.TITLE))
        department = cursor.getString(cursor.getColumnIndexOrThrow(CommonDataKinds.Organization.DEPARTMENT))
      }

      CommonDataKinds.Note.CONTENT_ITEM_TYPE -> {
        note = cursor.getString(cursor.getColumnIndexOrThrow(CommonDataKinds.Note.NOTE))
      }

      CommonDataKinds.Event.CONTENT_ITEM_TYPE -> {
        val item = DateModel()
        item.fromCursor(cursor)
        dates.add(item)
      }

      CommonDataKinds.Email.CONTENT_ITEM_TYPE -> {
        val item = EmailModel()
        item.fromCursor(cursor)
        emails.add(item)
      }

      CommonDataKinds.Im.CONTENT_ITEM_TYPE -> {
        val item = ImAddressModel()
        item.fromCursor(cursor)
        imAddresses.add(item)
      }

      CommonDataKinds.Phone.CONTENT_ITEM_TYPE -> {
        val item = PhoneNumberModel()
        item.fromCursor(cursor)
        phones.add(item)
      }

      CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE -> {
        val item = PostalAddressModel()
        item.fromCursor(cursor)
        addresses.add(item)
      }

      CommonDataKinds.Relation.CONTENT_ITEM_TYPE -> {
        val item = RelationshipModel()
        item.fromCursor(cursor)
        relationships.add(item)
      }

      CommonDataKinds.Website.CONTENT_ITEM_TYPE -> {
        val urlAddressModel = UrlAddressModel()
        urlAddressModel.fromCursor(cursor)
        urlAddresses.add(urlAddressModel)
      }

      CommonDataKinds.Nickname.CONTENT_ITEM_TYPE -> {
        val item = ExtraNameModel()
        item.fromCursor(cursor)
        extraNames.add(item)
      }
    }
    val hasCompanyName = company != null && company != ""
    contactType = if (hasCompanyName) {
      val hasFirstName = firstName != null && firstName != ""
      val hasMiddleName = middleName != null && middleName != ""
      val hasLastName = lastName != null && lastName != ""
      if (!hasFirstName && !hasMiddleName && !hasLastName) {
        "company"
      } else {
        "person"
      }
    } else {
      "person"
    }
  }

  fun getFinalFirstName(): String {
    return firstName ?: if (displayName == null) "" else displayName!!
  }

  fun getFinalLastName(): String {
    return lastName ?: if (displayName == null) "" else displayName!!
  }

  fun getFinalDisplayName(): String? {
    return if (displayName == null && firstName != null) {
      if (lastName == null) firstName else String.format("%s %s", firstName, lastName).trim { it <= ' ' }
    } else {
      displayName
    }
  }

  private fun toByteArray(bitmap: Bitmap): ByteArray {
    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
    return stream.toByteArray()
  }

  fun toInsertOperationList(): ArrayList<ContentProviderOperation> {
    val ops = ArrayList<ContentProviderOperation>()
    var op = ContentProviderOperation.newInsert(RawContacts.CONTENT_URI)
      .withValue(RawContacts.ACCOUNT_TYPE, null)
      .withValue(RawContacts.ACCOUNT_NAME, null)
      .withValue(RawContacts.STARRED, isFavorite)
    ops.add(op.build())
    op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
      .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
      .withValue(ContactsContract.Data.MIMETYPE, StructuredName.CONTENT_ITEM_TYPE)
      .withValue(StructuredName.DISPLAY_NAME, displayName)
      .withValue(StructuredName.GIVEN_NAME, firstName)
      .withValue(StructuredName.MIDDLE_NAME, middleName)
      .withValue(StructuredName.FAMILY_NAME, lastName)
      .withValue(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
      .withValue(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
      .withValue(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      .withValue(StructuredName.PREFIX, prefix)
      .withValue(StructuredName.SUFFIX, suffix)
    ops.add(op.build())
    op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
      .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
      .withValue(Columns.MIMETYPE, CommonDataKinds.Organization.CONTENT_ITEM_TYPE)
      .withValue(CommonDataKinds.Organization.COMPANY, company)
      .withValue(CommonDataKinds.Organization.TITLE, jobTitle)
      .withValue(CommonDataKinds.Organization.DEPARTMENT, department)
    ops.add(op.build())
    op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
      .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
      .withValue(Columns.MIMETYPE, CommonDataKinds.Note.CONTENT_ITEM_TYPE)
      .withValue(CommonDataKinds.Note.NOTE, note)
    ops.add(op.build())
    op.withYieldAllowed(true)
    if (!TextUtils.isEmpty(photoUri) || !TextUtils.isEmpty(rawPhotoUri)) {
      val photo = getThumbnailBitmap(if (TextUtils.isEmpty(rawPhotoUri)) photoUri else rawPhotoUri)
      ops.add(
        ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
          .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
          .withValue(Columns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
          .withValue(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
          .build()
      )
    }
    for (map in baseModels) {
      for (item in map) {
        ops.add(item.insertOperation)
      }
    }
    return ops
  }

  fun toUpdateOperationList(): ArrayList<ContentProviderOperation?> {
    val selection = String.format("%s=? AND %s=?", ContactsContract.Data.CONTACT_ID, ContactsContract.Data.MIMETYPE)
    val selectionArgs = arrayOf(contactId, StructuredName.CONTENT_ITEM_TYPE)
    val ops = ArrayList<ContentProviderOperation?>()
    var op: ContentProviderOperation.Builder = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
      .withSelection(selection, selectionArgs)
      .withValue(StructuredName.DISPLAY_NAME, displayName)
      .withValue(StructuredName.GIVEN_NAME, firstName)
      .withValue(StructuredName.MIDDLE_NAME, middleName)
      .withValue(StructuredName.FAMILY_NAME, lastName)
      .withValue(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
      .withValue(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
      .withValue(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      .withValue(StructuredName.PREFIX, prefix).withValue(StructuredName.SUFFIX, suffix)
    ops.add(op.build())
    op = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
      .withSelection(selection, selectionArgs)
      .withValue(CommonDataKinds.Organization.COMPANY, company)
      .withValue(CommonDataKinds.Organization.TITLE, jobTitle)
      .withValue(CommonDataKinds.Organization.DEPARTMENT, department)
    ops.add(op.build())
    op = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
      .withSelection(selection, arrayOf(contactId, CommonDataKinds.Note.CONTENT_ITEM_TYPE))
      .withValue(CommonDataKinds.Note.NOTE, note)
    ops.add(op.build())
    op.withYieldAllowed(true)
    if (!TextUtils.isEmpty(photoUri) || !TextUtils.isEmpty(rawPhotoUri)) {
      val photo = getThumbnailBitmap(if (TextUtils.isEmpty(rawPhotoUri)) photoUri else rawPhotoUri)
      ops.add(
        ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
          .withSelection(selection, arrayOf(rawContactId, CommonDataKinds.Photo.CONTENT_ITEM_TYPE))
          .build()
      )
      ops.add(
        ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
          .withValue(ContactsContract.Data.RAW_CONTACT_ID, rawContactId)
          .withValue(Columns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
          .withValue(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
          .build()
      )
    }
    for (map in baseModels) {
      for (item in map) {
        ops.add(item.getDeleteOperation(rawContactId!!))
        ops.add(item.getInsertOperation(rawContactId))
      }
    }
    return ops
  }

  private val baseModels: Array<List<BaseModel>>
    get() = arrayOf(dates, emails, imAddresses, phones, addresses, relationships, urlAddresses, extraNames)

  // convert to react native object
  @Throws(ParseException::class)
  fun toMap(fieldSet: Set<String>): Bundle {
    val contact = Bundle().apply {
      putString("lookupKey", lookupKey)
      putString("id", contactId)
      putString("name", if (!displayName.isNullOrEmpty()) displayName else "$firstName $lastName")

      firstName
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("firstName", it) }

      middleName
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("middleName", it) }

      lastName
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("lastName", it) }

      suffix
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("nameSuffix", it) }

      prefix
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("namePrefix", it) }

      phoneticFirstName
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("phoneticFirstName", it) }

      phoneticLastName
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("phoneticLastName", it) }

      phoneticMiddleName
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("phoneticMiddleName", it) }

      putString("contactType", contactType)

      company
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("company", it) }

      jobTitle
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("jobTitle", it) }

      department
        ?.takeIf(String::isNotEmpty)
        ?.let { putString("department", it) }

      putBoolean("imageAvailable", hasPhoto)

      putBoolean("isFavorite", isFavorite)
    }

    if (fieldSet.contains("image") && photoUri != null) {
      contact.putBundle(
        "image",
        Bundle().apply {
          putString("uri", photoUri)
        }
      )
    }
    if (fieldSet.contains("rawImage") && rawPhotoUri != null) {
      contact.putBundle(
        "image",
        Bundle().apply {
          putString("uri", rawPhotoUri)
        }
      )
    }
    if (fieldSet.contains("note") && !TextUtils.isEmpty(note)) {
      contact.putString("note", note)
    }
    if (fieldSet.contains("phoneNumbers") && phones.size > 0) {
      contact.putParcelableArrayList("phoneNumbers", ArrayList(phones.map { it.map }))
    }
    if (fieldSet.contains("emails") && emails.size > 0) {
      contact.putParcelableArrayList("emails", ArrayList(emails.map { it.map }))
    }
    if (fieldSet.contains("addresses") && addresses.size > 0) {
      contact.putParcelableArrayList("addresses", ArrayList(addresses.map { it.map }))
    }
    if (fieldSet.contains("instantMessageAddresses") && imAddresses.size > 0) {
      contact.putParcelableArrayList("instantMessageAddresses", ArrayList(imAddresses.map { it.map }))
    }
    if (fieldSet.contains("urlAddresses") && urlAddresses.size > 0) {
      contact.putParcelableArrayList("urlAddresses", ArrayList(urlAddresses.map { it.map }))
    }
    if (fieldSet.contains("relationships") && relationships.size > 0) {
      contact.putParcelableArrayList("relationships", ArrayList(relationships.map { it.map }))
    }
    if (extraNames.size > 0) {
      val showNickname = fieldSet.contains("nickname")
      val showMaidenName = fieldSet.contains("maidenName")
      for (i in extraNames.indices) {
        val item = extraNames[i]
        val data = item.data
        val label = item.label
        if (showMaidenName && label != null && label == "maidenName" && !TextUtils.isEmpty(data)) {
          contact.putString(label, data)
        }
        if (showNickname && label != null && label == "nickname" && !TextUtils.isEmpty(data)) {
          contact.putString(label, data)
        }
      }
    }
    val showBirthday = fieldSet.contains("birthday")
    val showDates = fieldSet.contains("dates")
    if (showDates || showBirthday) { // double if check with query with cursor
      var hasYear: Boolean
      val rawDatesArray = ArrayList<Bundle?>()
      val datesArray = ArrayList<Bundle?>()
      for (item in dates) {
        val calendar = Calendar.getInstance()
        val details = Bundle()
        val dateString = item.data
        val label = item.label
        val rawDate = Bundle().apply {
          putString("type", label)
          putString("value", dateString)
        }
        rawDatesArray.add(rawDate)
        try {
          hasYear = !dateString!!.startsWith("--")
          if (hasYear) {
            val datePattern = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            calendar.time = datePattern.parse(dateString)!!
          } else {
            val noYearPattern = SimpleDateFormat("--MM-dd", Locale.US)
            calendar.time = noYearPattern.parse(dateString)!!
          }
          if (hasYear) {
            details.putInt("year", calendar[Calendar.YEAR])
          }
          details.putInt("month", calendar[Calendar.MONTH])
          details.putInt("day", calendar[Calendar.DAY_OF_MONTH])
          // TODO: Evan: The type is only supported in 26+
          details.putString("format", "gregorian")
          if (showBirthday && label != null && label == "birthday") {
            contact.putBundle("birthday", details)
          } else {
            details.putString("label", label)
            datesArray.add(details)
          }
        } catch (e: Exception) {
          Log.w("Contact", e.toString())
        }
      }
      if (showDates) {
        if (datesArray.size > 0) {
          contact.putParcelableArrayList("dates", datesArray)
        }
      }
      if (rawDatesArray.size > 0) {
        contact.putParcelableArrayList("rawDates", rawDatesArray)
      }
    }
    return contact
  }

  val contentValues: ArrayList<ContentValues>
    get() {
      val contactData = ArrayList<ContentValues>()
      val name = ContentValues().apply {
        put(ContactsContract.Contacts.Data.MIMETYPE, CommonDataKinds.Identity.CONTENT_ITEM_TYPE)
        put(StructuredName.GIVEN_NAME, firstName)
        put(StructuredName.MIDDLE_NAME, middleName)
        put(StructuredName.FAMILY_NAME, lastName)
        put(StructuredName.PREFIX, prefix)
        put(StructuredName.SUFFIX, suffix)
        put(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
        put(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
        put(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      }
      contactData.add(name)

      val organization = ContentValues().apply {
        put(ContactsContract.Data.MIMETYPE, CommonDataKinds.Organization.CONTENT_ITEM_TYPE)
        put(CommonDataKinds.Organization.COMPANY, company)
        put(CommonDataKinds.Organization.TITLE, jobTitle)
        put(CommonDataKinds.Organization.DEPARTMENT, department)
      }
      contactData.add(organization)

      val notes = ContentValues().apply {
        put(ContactsContract.Data.MIMETYPE, CommonDataKinds.Note.CONTENT_ITEM_TYPE)
        put(CommonDataKinds.Note.NOTE, note)
      }
      contactData.add(notes)

      if (!photoUri.isNullOrBlank()) {
        val photo = getThumbnailBitmap(Uri.parse(photoUri).path)
        val image = ContentValues().apply {
          put(Columns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
          put(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
        }
        contactData.add(image)
      }
      if (!rawPhotoUri.isNullOrBlank()) {
        val photo = getThumbnailBitmap(rawPhotoUri)
        val image = ContentValues().apply {
          put(Columns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
          put(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
        }
        contactData.add(image)
      }
      val isFavoriteValue = ContentValues().apply {
        put("isFavorite", if (isFavorite) 1 else 0)
      }
      contactData.add(isFavoriteValue)
      for (map in baseModels) {
        for (item in map) {
          contactData.add(item.contentValues)
        }
      }
      return contactData
    }

  private fun getThumbnailBitmap(photoUri: String?): Bitmap {
    val path = Uri.parse(photoUri).path
    return BitmapFactory.decodeFile(path)
  }
}

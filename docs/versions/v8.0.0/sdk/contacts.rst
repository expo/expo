Contacts
========

Provides access to the phone's system contacts.

.. function:: Exponent.Contacts.getContactsAsync(fields)

   Get a list of all entries in the system contacts. This returns the name and
   optionally phone number and email of each contact.

   :param array fields:
      An array describing fields to retrieve per contact. Each element bust be
      one of ``Exponent.Contacts.PHONE_NUMBER`` or ``Exponent.Contacts.EMAIL``.
   :returns:
      An array of objects of the form ``{ id, name, phoneNumber, email }`` with
      ``phoneNumber`` and ``email`` only present if they were requested through
      the ``fields`` parameter.

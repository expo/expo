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

   :example:
      .. code-block:: javascript

        async function showFirstContactAsync() {
          const contacts = await Exponent.Contacts.getContactsAsync([
            Exponent.Contacts.PHONE_NUMBER,
            Exponent.Contacts.EMAIL,
          ]);
          if (contacts.length > 0) {
            Alert.alert(
              'Your first contact is...',
              `Name: ${contacts[0].name}\n` +
              `Phone: ${contacts[0].phoneNumber}\n` +
              `Email: ${contacts[0].email}`
            );
          }
        }

      This function will display the first entry in the user's contacts.

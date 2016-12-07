Contacts
========

Provides access to the phone's system contacts.

.. function:: Exponent.Contacts.getContactsAsync(fields)

   Get a list of all entries in the system contacts. This returns the name and
   optionally phone number and email of each contact.

   :param array fields:
      An array describing fields to retrieve per contact. Each element must be
      one of ``Exponent.Contacts.PHONE_NUMBERS`` or ``Exponent.Contacts.EMAILS``.
   :returns:
      An array of objects of the form ``{ id, name, phoneNumbers, emails, addresses, jobTitle, company  }`` with
      ``phoneNumbers``, ``emails``, and ``addresses`` only present if they were
      requested through the ``fields`` parameter. iOS also includes ``firstName, middleName, lastName``.

   :example:
      .. code-block:: javascript

        async function showFirstContactAsync() {
          const contacts = await Exponent.Contacts.getContactsAsync([
            Exponent.Contacts.PHONE_NUMBERS,
            Exponent.Contacts.EMAILS,
          ]);
          if (contacts.length > 0) {
            Alert.alert(
              'Your first contact is...',
              `Name: ${contacts[0].name}\n` +
              `Phone: ${JSON.stringify(contacts[0].phoneNumbers)}\n` +
              `Email: ${JSON.stringify(contacts[0].emails)}`
            );
          }
        }

      This function will display the first entry in the user's contacts.

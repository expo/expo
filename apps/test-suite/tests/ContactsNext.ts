import { Contact, ContactField } from 'expo-contacts/next';

export const name = 'Contacts@Next';

export async function test(t) {
  const contacts: Contact[] = [];

  t.beforeAll(async () => {
    const permission = await Contact.requestPermissionsAsync();
    t.expect(permission.granted).toBe(true);
  });
  t.afterAll(async () => {
    for (const contact of contacts) {
      await contact.delete();
    }
  });

  t.describe('Contact creation', () => {
    t.it('should create a contact', async () => {
      const contactDetails = {
        givenName: 'Test',
        familyName: 'User',
        phones: [{ label: 'mobile', number: '123456789' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      t.expect(newContact).toBeDefined();
      t.expect(newContact.id).toBeDefined();
    });
  });

  t.describe('Fetch contacts', () => {
    t.it('should fetch all contacts', async () => {
      const contacts = await Contact.getAll();
      t.expect(contacts).toBeDefined();
      t.expect(Array.isArray(contacts)).toBe(true);
    });
    t.it('should fetch contact details', async () => {
      const contactDetails = {
        givenName: 'Detail',
        familyName: 'Fetcher',
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      const fetchedDetails = await newContact.getDetails([
        ContactField.GIVEN_NAME,
        ContactField.FAMILY_NAME,
      ]);
      t.expect(fetchedDetails.givenName).toBe(contactDetails.givenName);
      t.expect(fetchedDetails.familyName).toBe(contactDetails.familyName);
      t.expect(fetchedDetails.company).toBeUndefined();
    });

    t.it('should fetch contact emails and phones', async () => {
      const contactDetails = {
        givenName: 'Info',
        familyName: 'Fetcher',
        emails: [{ label: 'work', address: 'info@fetcher.com' }],
        phones: [{ label: 'mobile', number: '123456789' }],
      };

      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      const fetchedDetails = await newContact.getDetails([
        ContactField.GIVEN_NAME,
        ContactField.FAMILY_NAME,
        ContactField.EMAILS,
        ContactField.PHONES,
      ]);
      t.expect(fetchedDetails.givenName).toBe(contactDetails.givenName);
      t.expect(fetchedDetails.familyName).toBe(contactDetails.familyName);
      t.expect(fetchedDetails.emails.length).toBe(1);
      t.expect(fetchedDetails.emails[0].address).toBe(contactDetails.emails[0].address);
      t.expect(fetchedDetails.phones.length).toBe(1);
      t.expect(fetchedDetails.phones[0].number).toBe(contactDetails.phones[0].number);
    });

    t.it('should fetch all contacts with details', async () => {
      const contactDetails1 = {
        givenName: 'AllDetails1',
        emails: [{ label: 'work', address: 'all@details.com' }],
      };
      const contactDetails2 = {
        givenName: 'AllDetails2',
        relationships: [{ label: 'spouse', name: 'Partner' }],
      };
      const newContact1 = await Contact.create(contactDetails1);
      contacts.push(newContact1);
      const newContact2 = await Contact.create(contactDetails2);
      contacts.push(newContact2);
      const allContacts = await Contact.getAllWithDetails([
        ContactField.GIVEN_NAME,
        ContactField.EMAILS,
        ContactField.RELATIONSHIPS,
      ]);
      const fetchedContact1 = allContacts.find((c) => c.givenName === contactDetails1.givenName);
      const fetchedContact2 = allContacts.find((c) => c.givenName === contactDetails2.givenName);
      t.expect(fetchedContact1).toBeDefined();
      t.expect(fetchedContact1.emails.length).toBe(1);
      t.expect(fetchedContact1.emails[0].address).toBe(contactDetails1.emails[0].address);
      t.expect(fetchedContact2).toBeDefined();
      t.expect(fetchedContact2.relationships.length).toBe(1);
      t.expect(fetchedContact2.relationships[0].name).toBe(contactDetails2.relationships[0].name);
    });
  });

  t.describe('Set, Get properties', () => {
    let contact: Contact;

    t.beforeAll(async () => {
      const contactDetails = {
        givenName: 'Name',
        familyName: 'Tester',
      };
      contact = await Contact.create(contactDetails);
      t.expect(contact.id).toBeDefined();
    });

    t.afterAll(async () => {
      await contact.delete();
    });

    t.it('should set and get givenName', async () => {
      const newGivenName = 'John';
      await contact.setGivenName(newGivenName);
      const retrievedGivenName = await contact.getGivenName();
      t.expect(retrievedGivenName).toBe(newGivenName);
    });

    t.it('should set and get familyName', async () => {
      const newFamilyName = 'Doe';
      console.log('contactId', contact);
      await contact.setFamilyName(newFamilyName);
      const retrievedFamilyName = await contact.getFamilyName();
      t.expect(retrievedFamilyName).toBe(newFamilyName);
    });

    t.it('should set and get middleName', async () => {
      const newMiddleName = 'Robert';
      await contact.setMiddleName(newMiddleName);
      const retrievedMiddleName = await contact.getMiddleName();
      t.expect(retrievedMiddleName).toBe(newMiddleName);
    });

    t.it('should set and get prefix', async () => {
      const newPrefix = 'Dr.';
      await contact.setPrefix(newPrefix);
      const retrievedPrefix = await contact.getPrefix();
      t.expect(retrievedPrefix).toBe(newPrefix);
    });

    t.it('should set and get suffix', async () => {
      const newSuffix = 'Jr.';
      await contact.setSuffix(newSuffix);
      const retrievedSuffix = await contact.getSuffix();
      t.expect(retrievedSuffix).toBe(newSuffix);
    });

    t.it('should set and get phoneticGivenName', async () => {
      const newPhoneticGivenName = 'Jon';
      await contact.setPhoneticGivenName(newPhoneticGivenName);
      const retrievedPhoneticGivenName = await contact.getPhoneticGivenName();
      t.expect(retrievedPhoneticGivenName).toBe(newPhoneticGivenName);
    });

    t.it('should set and get phoneticMiddleName', async () => {
      const newPhoneticMiddleName = 'Rob-ert';
      await contact.setPhoneticMiddleName(newPhoneticMiddleName);
      const retrievedPhoneticMiddleName = await contact.getPhoneticMiddleName();
      t.expect(retrievedPhoneticMiddleName).toBe(newPhoneticMiddleName);
    });

    t.it('should set and get phoneticFamilyName', async () => {
      const newPhoneticFamilyName = 'Doh';
      await contact.setPhoneticFamilyName(newPhoneticFamilyName);
      const retrievedPhoneticFamilyName = await contact.getPhoneticFamilyName();
      t.expect(retrievedPhoneticFamilyName).toBe(newPhoneticFamilyName);
    });

    t.it('should handle setting a field to null', async () => {
      const middleName = 'InitialMiddle';
      await contact.setMiddleName(middleName);
      let retrieved = await contact.getMiddleName();
      t.expect(retrieved).toBe(middleName);

      await contact.setMiddleName(null);
      retrieved = await contact.getMiddleName();
      t.expect(retrieved).toBeNull();
    });
    t.it('should set and get company', async () => {
      const newCompany = 'Expo';
      await contact.setCompany(newCompany);
      const retrievedCompany = await contact.getCompany();
      t.expect(retrievedCompany).toBe(newCompany);
    });

    t.it('should set and get department', async () => {
      const newDepartment = 'Engineering';
      await contact.setDepartment(newDepartment);
      const retrievedDepartment = await contact.getDepartment();
      t.expect(retrievedDepartment).toBe(newDepartment);
    });

    t.it('should set and get jobTitle', async () => {
      const newJobTitle = 'Software Developer';
      await contact.setJobTitle(newJobTitle);
      const retrievedJobTitle = await contact.getJobTitle();
      t.expect(retrievedJobTitle).toBe(newJobTitle);
    });

    t.it('should set and get phoneticOrganizationName', async () => {
      const newPhoneticName = 'Eks-po';
      await contact.setPhoneticOrganizationName(newPhoneticName);
      const retrievedPhoneticName = await contact.getPhoneticOrganizationName();
      t.expect(retrievedPhoneticName).toBe(newPhoneticName);
    });

    t.it('should set and get note', async () => {
      const newNotes = 'These are some notes.';
      await contact.setNote(newNotes);
      const retrievedNotes = await contact.getNote();
      t.expect(retrievedNotes).toBe(newNotes);
    });

    t.it('should handle setting an organization field to null', async () => {
      const company = 'Initial Company';
      await contact.setCompany(company);
      let retrieved = await contact.getCompany();
      t.expect(retrieved).toBe(company);

      await contact.setCompany(null);
      retrieved = await contact.getCompany();
      t.expect(retrieved).toBeNull();
    });
  });
  t.describe('Add, Get, Update, Delete list properties', () => {
    let contact: Contact;
    t.beforeAll(async () => {
      const contactDetails = {
        givenName: 'List',
        familyName: 'Tester',
      };
      contact = await Contact.create(contactDetails);
    });

    t.afterAll(async () => {
      await contact.delete();
    });

    t.it('should add, get, update, and delete emails', async () => {
      const emailId = await contact.addEmail({ label: 'work', address: 'work@example.com' });
      t.expect(emailId).not.toBeNull();
      let emails = await contact.getEmails();
      t.expect(emails.length).toBe(1);
      t.expect(emails[0].id).toBe(emailId);

      await contact.updateEmail({
        id: emailId,
        label: 'work-updated',
        address: 'work-updated@example.com',
      });
      emails = await contact.getEmails();
      t.expect(emails[0].label).toBe('work-updated');
      t.expect(emails[0].address).toBe('work-updated@example.com');
      await contact.deleteEmail(emails[0]);
      emails = await contact.getEmails();
      t.expect(emails.length).toBe(0);
    });

    t.it('should add, get, update, and delete phones', async () => {
      const phoneId = await contact.addPhone({ label: 'mobile', number: '123456789' });
      let phones = await contact.getPhones();
      t.expect(phones.length).toBe(1);
      t.expect(phones[0].id).toBe(phoneId);

      await contact.updatePhone({ id: phoneId, label: 'mobile-updated', number: '987654321' });
      phones = await contact.getPhones();
      t.expect(phones[0].label).toBe('mobile-updated');
      t.expect(phones[0].number).toBe('987654321');

      await contact.deletePhone(phones[0]);
      phones = await contact.getPhones();
      t.expect(phones.length).toBe(0);
    });

    t.it('should add, get, update, and delete dates', async () => {
      const dateId = await contact.addDate({
        label: 'birthday',
        date: {
          year: '1991',
          month: '02',
          day: '02',
        },
      });
      t.expect(dateId).toBeDefined();
      let dates = await contact.getDates();
      t.expect(dates.length).toBe(1);
      t.expect(dates[0].id).toBe(dateId);

      await contact.updateDate({
        id: dateId,
        label: 'birthday-updated',
        date: {
          year: '1991',
          month: '02',
          day: '02',
        },
      });
      dates = await contact.getDates();
      t.expect(dates[0].label).toBe('birthday-updated');
      t.expect(dates[0].date.year).toBe('1991');
      t.expect(dates[0].date.month).toBe('02');
      t.expect(dates[0].date.day).toBe('02');
      await contact.deleteDate(dates[0]);
      dates = await contact.getDates();
      t.expect(dates.length).toBe(0);
    });

    t.it('should add, get, update, and delete extra names', async () => {
      const extraNameId = await contact.addExtraName({ label: 'nickname', name: 'Johnny' });
      let extraNames = await contact.getExtraNames();
      t.expect(extraNames.length).toBe(1);
      t.expect(extraNames[0].id).toBe(extraNameId);

      await contact.updateExtraName({ id: extraNameId, label: 'nickname-updated', name: 'John' });
      extraNames = await contact.getExtraNames();
      t.expect(extraNames[0].label).toBe('nickname-updated');
      t.expect(extraNames[0].name).toBe('John');

      await contact.deleteExtraName(extraNames[0]);
      extraNames = await contact.getExtraNames();
      t.expect(extraNames.length).toBe(0);
    });

    t.it('should add, get, update, and delete postal addresses', async () => {
      const postalAddressId = await contact.addPostalAddress({
        label: 'home',
        street: '123 Main St',
        city: 'Springfield',
        postcode: '12345',
        country: 'USA',
      });
      let addresses = await contact.getPostalAddresses();
      t.expect(addresses.length).toBe(1);
      t.expect(addresses[0].id).toBe(postalAddressId);

      await contact.updatePostalAddress({
        id: postalAddressId,
        label: 'home-updated',
        street: '456 Oak St',
        city: 'Shelbyville',
        postcode: '54321',
        country: 'USA',
      });
      addresses = await contact.getPostalAddresses();
      t.expect(addresses[0].label).toBe('home-updated');
      t.expect(addresses[0].street).toBe('456 Oak St');

      await contact.deletePostalAddress(addresses[0]);
      addresses = await contact.getPostalAddresses();
      t.expect(addresses.length).toBe(0);
    });

    t.it('should add, get, update, and delete relationships', async () => {
      const relationshipId = await contact.addRelationship({ label: 'spouse', name: 'Jane Doe' });
      let relationships = await contact.getRelationships();
      t.expect(relationships.length).toBe(1);
      t.expect(relationships[0].id).toBe(relationshipId);

      await contact.updateRelationship({
        id: relationshipId,
        label: 'partner',
        name: 'Jane Smith',
      });
      relationships = await contact.getRelationships();
      t.expect(relationships[0].label).toBe('partner');
      t.expect(relationships[0].name).toBe('Jane Smith');

      await contact.deleteRelationship(relationships[0]);
      relationships = await contact.getRelationships();
      t.expect(relationships.length).toBe(0);
    });

    t.it('should add, get, update, and delete URL addresses', async () => {
      const urlId = await contact.addUrlAddress({ label: 'website', url: 'https://example.com' });
      let urls = await contact.getUrlAddresses();
      t.expect(urls.length).toBe(1);
      t.expect(urls[0].id).toBe(urlId);

      await contact.updateUrlAddress({
        id: urlId,
        label: 'website-updated',
        url: 'https://updated.com',
      });
      urls = await contact.getUrlAddresses();
      t.expect(urls[0].label).toBe('website-updated');
      t.expect(urls[0].url).toBe('https://updated.com');

      await contact.deleteUrlAddress(urls[0]);
      urls = await contact.getUrlAddresses();
      t.expect(urls.length).toBe(0);
    });
  });

  t.describe('Contact patch', () => {
    t.it('should update structuredName fields correctly', async () => {
      const contactDetails = {
        givenName: 'InitialGiven',
        middleName: 'InitialMiddle',
        familyName: 'InitialFamily',
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      await newContact.patch({
        givenName: 'UpdatedGiven',
        familyName: null,
      });

      const givenName = await newContact.getGivenName();
      const middleName = await newContact.getMiddleName();
      const familyName = await newContact.getFamilyName();

      t.expect(givenName).toBe('UpdatedGiven');
      t.expect(middleName).toBe('InitialMiddle');
      t.expect(familyName).toBe(null);
    });

    t.it('should update organization fields correctly', async () => {
      const contactDetails = {
        company: 'InitialCompany',
        department: 'InitialDepartment',
        jobTitle: 'InitialJobTitle',
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      await newContact.patch({
        company: 'UpdatedCompany',
        jobTitle: null,
      });

      const company = await newContact.getCompany();
      const department = await newContact.getDepartment();
      const jobTitle = await newContact.getJobTitle();
      t.expect(company).toBe('UpdatedCompany');
      t.expect(department).toBe('InitialDepartment');
      t.expect(jobTitle).toBe(null);
    });

    t.it('should update an existing email and add a new one', async () => {
      const contactDetails = {
        givenName: 'Email',
        familyName: 'User',
        emails: [{ label: 'work', address: 'work@example.com' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      const emails = await newContact.getEmails();
      await newContact.patch({
        emails: [
          { ...emails[0], address: 'work_updated@example.com' },
          { label: 'personal', address: 'personal_updated@example.com' },
        ],
      });
      const updatedEmails = await newContact.getEmails();
      console.log('Updated emails:', updatedEmails);
      t.expect(updatedEmails.length).toBe(2);
      t.expect(updatedEmails.some((e) => e.address === 'work_updated@example.com')).toBe(true);
      t.expect(updatedEmails.some((e) => e.address === 'personal_updated@example.com')).toBe(true);
      t.expect(updatedEmails.some((e) => e.address === 'work@example.com')).toBe(false);
    });

    t.it('should clear emails if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Email',
        familyName: 'User',
        emails: [{ label: 'work', address: 'work@example.com' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getEmails();
      await newContact.patch({
        emails: null,
      });
      const updatedEmails = await newContact.getEmails();
      t.expect(updatedEmails.length).toBe(0);
    });

    t.it('should update an existing phone and add a new one', async () => {
      const contactDetails = {
        givenName: 'Phone',
        familyName: 'User',
        phones: [{ label: 'work', number: '123456789' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const phones = await newContact.getPhones();
      await newContact.patch({
        phones: [
          { ...phones[0], number: '+48987654321' },
          { label: 'personal', number: '+48111222333' },
        ],
      });

      const updatedPhones = await newContact.getPhones();
      t.expect(updatedPhones.length).toBe(2);
      t.expect(updatedPhones.some((p) => p.number === '+48987654321')).toBe(true);
      t.expect(updatedPhones.some((p) => p.number === '+48111222333')).toBe(true);
      t.expect(updatedPhones.some((p) => p.number === '123456789')).toBe(false);
    });

    t.it('should clear phones if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Phone',
        familyName: 'User',
        phones: [{ label: 'work', number: '123456789' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getPhones();
      await newContact.patch({
        phones: null,
      });
      const updatedPhones = await newContact.getPhones();
      t.expect(updatedPhones.length).toBe(0);
    });

    t.it('should update an existing date and add a new one', async () => {
      const contactDetails = {
        givenName: 'Date',
        familyName: 'User',
        dates: [
          {
            label: 'birthday',
            date: {
              year: '1990',
              month: '01',
              day: '01',
            },
          },
        ],
      };

      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const dates = await newContact.getDates();
      await newContact.patch({
        dates: [
          {
            ...dates[0],
            date: {
              year: '1991',
              month: '01',
              day: '01',
            },
          },
          {
            label: 'anniversary',
            date: {
              year: '2020',
              month: '01',
              day: '01',
            },
          },
        ],
      });

      const updatedDates = await newContact.getDates();
      t.expect(updatedDates.length).toBe(2);
      t.expect(updatedDates.some((d) => d.date.year === '1991')).toBe(true);
      t.expect(updatedDates.some((d) => d.date.year === '2020')).toBe(true);
      t.expect(updatedDates.some((d) => d.date.year === '1990')).toBe(false);
    });

    t.it('should clear dates if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Date',
        familyName: 'User',
        dates: [
          {
            label: 'birthday',
            date: {
              year: '1990',
              month: '01',
              day: '01',
            },
          },
        ],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getDates();
      await newContact.patch({
        dates: null,
      });
      const updatedDates = await newContact.getDates();
      t.expect(updatedDates.length).toBe(0);
    });

    t.it('should update an existing extraName and add a new one', async () => {
      const contactDetails = {
        givenName: 'Extra',
        familyName: 'User',
        extraNames: [{ label: 'nickname', name: 'Tester' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const extraNames = await newContact.getExtraNames();
      await newContact.patch({
        extraNames: [
          { ...extraNames[0], name: 'TesterUpdated' },
          { label: 'alias', name: 'ExtraAlias' },
        ],
      });

      const updatedExtraNames = await newContact.getExtraNames();
      t.expect(updatedExtraNames.length).toBe(2);
      t.expect(updatedExtraNames.some((n) => n.name === 'TesterUpdated')).toBe(true);
      t.expect(updatedExtraNames.some((n) => n.name === 'ExtraAlias')).toBe(true);
      t.expect(updatedExtraNames.some((n) => n.name === 'Tester')).toBe(false);
    });

    t.it('should clear extraNames if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Extra',
        familyName: 'User',
        extraNames: [{ label: 'nickname', name: 'Tester' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getExtraNames();
      await newContact.patch({
        extraNames: null,
      });
      const updatedExtraNames = await newContact.getExtraNames();
      t.expect(updatedExtraNames.length).toBe(0);
    });

    t.it('should update an existing postal address and add a new one', async () => {
      const contactDetails = {
        givenName: 'Postal',
        familyName: 'User',
        postalAddresses: [
          {
            label: 'home',
            street: '123 Main St',
            city: 'Warsaw',
            region: 'Mazowieckie',
            postcode: '00-001',
            country: 'Poland',
          },
        ],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const addresses = await newContact.getPostalAddresses();
      await newContact.patch({
        postalAddresses: [
          { ...addresses[0], street: '456 Updated St' },
          {
            label: 'work',
            street: 'Office St 1',
            city: 'Krakow',
            region: 'Malopolskie',
            postcode: '30-001',
            country: 'Poland',
          },
        ],
      });

      const updatedAddresses = await newContact.getPostalAddresses();
      t.expect(updatedAddresses.length).toBe(2);
      t.expect(updatedAddresses.some((a) => a.street === '456 Updated St')).toBe(true);
      t.expect(updatedAddresses.some((a) => a.street === 'Office St 1')).toBe(true);
      t.expect(updatedAddresses.some((a) => a.street === '123 Main St')).toBe(false);
    });

    t.it('should clear postal addresses if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Postal',
        familyName: 'User',
        postalAddresses: [
          {
            label: 'home',
            street: '123 Main St',
            city: 'Warsaw',
            region: 'Mazowieckie',
            postcode: '00-001',
            country: 'Poland',
          },
        ],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getPostalAddresses();
      await newContact.patch({
        postalAddresses: null,
      });
      const updatedAddresses = await newContact.getPostalAddresses();
      t.expect(updatedAddresses.length).toBe(0);
    });

    t.it('should update an existing relationship and add a new one', async () => {
      const contactDetails = {
        givenName: 'Relation',
        familyName: 'User',
        relationships: [{ label: 'spouse', name: 'Alice' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const relationships = await newContact.getRelationships();
      await newContact.patch({
        relationships: [
          { ...relationships[0], name: 'AliceUpdated' },
          { label: 'child', name: 'Bob' },
        ],
      });

      const updatedRelationships = await newContact.getRelationships();
      t.expect(updatedRelationships.length).toBe(2);
      t.expect(updatedRelationships.some((r) => r.name === 'AliceUpdated')).toBe(true);
      t.expect(updatedRelationships.some((r) => r.name === 'Bob')).toBe(true);
      t.expect(updatedRelationships.some((r) => r.name === 'Alice')).toBe(false);
    });

    t.it('should clear relationships if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Relation',
        familyName: 'User',
        relationships: [{ label: 'spouse', name: 'Alice' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getRelationships();
      await newContact.patch({
        relationships: null,
      });
      const updatedRelationships = await newContact.getRelationships();
      t.expect(updatedRelationships.length).toBe(0);
    });

    t.it('should update an existing website and add a new one', async () => {
      const contactDetails = {
        givenName: 'Web',
        familyName: 'User',
        urlAddresses: [{ label: 'personal', url: 'https://example.com' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);

      const urls = await newContact.getUrlAddresses();
      await newContact.patch({
        urlAddresses: [
          { ...urls[0], url: 'https://updated.example.com' },
          { label: 'work', url: 'https://work.example.com' },
        ],
      });

      const updatedUrls = await newContact.getUrlAddresses();
      t.expect(updatedUrls.length).toBe(2);
      t.expect(updatedUrls.some((u) => u.url === 'https://updated.example.com')).toBe(true);
      t.expect(updatedUrls.some((u) => u.url === 'https://work.example.com')).toBe(true);
      t.expect(updatedUrls.some((u) => u.url === 'https://example.com')).toBe(false);
    });

    t.it('should clear websites if patch is called with null', async () => {
      const contactDetails = {
        givenName: 'Web',
        familyName: 'User',
        urlAddresses: [{ label: 'personal', url: 'https://example.com' }],
      };
      const newContact = await Contact.create(contactDetails);
      contacts.push(newContact);
      await newContact.getUrlAddresses();
      await newContact.patch({
        urlAddresses: null,
      });
      const updatedUrls = await newContact.getUrlAddresses();
      t.expect(updatedUrls.length).toBe(0);
    });
    t.it(
      'should handle a comprehensive patch updating all field types simultaneously',
      async () => {
        const initialContactDetails = {
          givenName: 'InitialGiven',
          familyName: 'InitialFamily',
          company: 'InitialCompany',
          jobTitle: 'InitialJob',
          emails: [{ label: 'work', address: 'work@example.com' }],
          phones: [{ label: 'work', number: '111222333' }],
          dates: [{ label: 'birthday', date: { year: '1990', month: '01', day: '01' } }],
          extraNames: [{ label: 'nickname', name: 'InitialNickname' }],
          postalAddresses: [
            {
              label: 'home',
              street: '123 Initial St',
              city: 'Warsaw',
              country: 'Poland',
            },
          ],
          relationships: [{ label: 'spouse', name: 'InitialSpouse' }],
          urlAddresses: [{ label: 'homepage', url: 'https://initial.example.com' }],
        };

        const newContact = await Contact.create(initialContactDetails);
        contacts.push(newContact);

        const initialEmails = await newContact.getEmails();
        const initialPhones = await newContact.getPhones();
        const initialDates = await newContact.getDates();
        const initialExtraNames = await newContact.getExtraNames();
        const initialAddresses = await newContact.getPostalAddresses();
        const initialUrls = await newContact.getUrlAddresses();

        await newContact.patch({
          givenName: 'UpdatedGiven',
          middleName: 'NewMiddleName',
          familyName: null,

          company: 'UpdatedCompany',
          jobTitle: null,

          note: 'This is an updated note.',

          emails: [
            { ...initialEmails[0], address: 'work_updated@example.com' },
            { label: 'personal', address: 'personal_new@example.com' },
          ],

          phones: [
            { ...initialPhones[0], number: '+48999888777' },
            { label: 'mobile', number: '+48555444333' },
          ],

          dates: [
            { ...initialDates[0], date: { year: '1991', month: '02', day: '02' } },
            { label: 'anniversary', date: { year: '2021', month: '10', day: '10' } },
          ],

          extraNames: [
            { ...initialExtraNames[0], name: 'UpdatedNickname' },
            { label: 'alias', name: 'NewAlias' },
          ],

          postalAddresses: [
            { ...initialAddresses[0], street: '456 Updated St' },
            { label: 'work', street: '987 Work Ave', city: 'Krakow', country: 'Poland' },
          ],

          relationships: null,

          urlAddresses: [
            { ...initialUrls[0], url: 'https://updated.example.com' },
            { label: 'work', url: 'https://work.example.com' },
          ],
        });

        const updatedContact = await newContact.getDetails();

        t.expect(updatedContact.givenName).toBe('UpdatedGiven');
        t.expect(updatedContact.middleName).toBe('NewMiddleName');
        t.expect(updatedContact.familyName).toBe(null);

        t.expect(updatedContact.company).toBe('UpdatedCompany');
        t.expect(updatedContact.jobTitle).toBe(null);

        const note = await newContact.getNote();
        t.expect(note).toBe('This is an updated note.');

        const updatedEmails = await newContact.getEmails();
        t.expect(updatedEmails.length).toBe(2);
        t.expect(updatedEmails.some((e) => e.address === 'work_updated@example.com')).toBe(true);
        t.expect(updatedEmails.some((e) => e.address === 'personal_new@example.com')).toBe(true);

        const updatedPhones = await newContact.getPhones();
        t.expect(updatedPhones.length).toBe(2);
        t.expect(updatedPhones.some((p) => p.number === '+48999888777')).toBe(true);
        t.expect(updatedPhones.some((p) => p.number === '+48555444333')).toBe(true);

        const updatedDates = await newContact.getDates();
        t.expect(updatedDates.length).toBe(2);
        t.expect(updatedDates.some((d) => d.date.year === '1991')).toBe(true);
        t.expect(updatedDates.some((d) => d.date.year === '2021')).toBe(true);

        const updatedExtraNames = await newContact.getExtraNames();
        t.expect(updatedExtraNames.length).toBe(2);
        t.expect(updatedExtraNames.some((n) => n.name === 'UpdatedNickname')).toBe(true);
        t.expect(updatedExtraNames.some((n) => n.name === 'NewAlias')).toBe(true);

        const updatedAddresses = await newContact.getPostalAddresses();
        t.expect(updatedAddresses.length).toBe(2);
        t.expect(updatedAddresses.some((a) => a.street === '456 Updated St')).toBe(true);
        t.expect(updatedAddresses.some((a) => a.street === '987 Work Ave')).toBe(true);

        const updatedRelationships = await newContact.getRelationships();
        t.expect(updatedRelationships.length).toBe(0);

        const updatedUrls = await newContact.getUrlAddresses();
        t.expect(updatedUrls.length).toBe(2);
        t.expect(updatedUrls.some((u) => u.url === 'https://updated.example.com')).toBe(true);
        t.expect(updatedUrls.some((u) => u.url === 'https://work.example.com')).toBe(true);
      }
    );
  });
}

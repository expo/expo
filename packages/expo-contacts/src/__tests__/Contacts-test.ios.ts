import * as Contacts from '../legacy/Contacts';
import ExpoContacts from '../legacy/ExpoContacts';

describe('presentFormAsync', () => {
  it(`should invalidate contact when ID is provided`, async () => {
    const contactId = '<DEBUG>';
    const contact = {
      id: '<DEBUG_ID>',
      contactType: Contacts.ContactTypes.Person,
      name: '<DEBUG_NAME>',
    };
    await Contacts.presentFormAsync(contactId, contact);

    expect(ExpoContacts.presentFormAsync).toHaveBeenCalledWith(contactId, undefined, {});
  });
});

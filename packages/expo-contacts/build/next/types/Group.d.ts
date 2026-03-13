import { Contact } from './Contact';
import { ContactQueryOptions } from './Contact.props';
export declare class Group {
    /**
     * Constructor for Group instance.
     * While you can instantiate this class directly if you have an ID, the recommended way to obtain a `Group` instance
     * is to use static methods like `Group.getAll` or `Group.create`.
     * @platform ios
     * @param id - The unique identifier of the group.
     */
    constructor(id: string);
    /**
     * The unique identifier for the group.
     * @platform ios
     */
    readonly id: string;
    /**
     * Retrieves the name of the group.
     * @returns a promise resolving to the group name string or `null` if not set.
     * @platform ios
     * @example
     * ```ts
     * const name = await group.getName(); // 'Family'
     * ```
     */
    getName(): Promise<string | null>;
    /**
     * Renames the group.
     * @param name - The new name for the group.
     * @platform ios
     * @returns a promise that resolves when the group is successfully renamed.
     * @example
     * ```ts
     * await group.setName('Close Friends');
     * ```
     */
    setName(name: string): Promise<void>;
    /**
     * Adds a contact to the group.
     * @param contact - The [`Contact`](#contact) instance to add to the group.
     * @platform ios
     * @returns a promise that resolves when the contact is successfully added.
     * @example
     * ```ts
     * await group.addContact(contact);
     * ```
     */
    addContact(contact: Contact): Promise<void>;
    /**
     * Removes a contact from the group.
     * @param contact - The [`Contact`](#contact) instance to remove from the group.
     * @platform ios
     * @returns a promise that resolves when the contact is successfully removed.
     * @example
     * ```ts
     * await group.removeContact(contact);
     * ```
     */
    removeContact(contact: Contact): Promise<void>;
    /**
     * Retrieves contacts belonging to this group.
     * @param options - Options to filter, sort, or limit the results.
     * @platform ios
     * @returns a promise resolving to an array of [`Contact`](#contact) instances in this group.
     * @example
     * ```ts
     * const groupMembers = await group.getContacts({ sort: 'firstName' });
     * ```
     */
    getContacts(options?: ContactQueryOptions): Promise<Contact[]>;
    /**
     * Deletes the group from the device.
     *
     * > **Note:** This usually deletes the group definition but leaves the contacts themselves intact in the address book.
     *
     * @returns a promise that resolves when the group is successfully deleted.
     * @platform ios
     * @example
     * ```ts
     * await group.delete();
     * ```
     */
    delete(): Promise<void>;
    /**
     * A static method that creates a new group.
     * @param name - The name of the new group.
     * @param containerId - The ID of the container where the group should be created. If omitted, the default container is used.
     * @platform ios
     * @returns a promise resolving to the newly created [`Group`](#group) instance.
     * @example
     * ```ts
     * const newGroup = await Group.create('Gym Buddies');
     * ```
     */
    static create(name: string, containerId?: string): Promise<Group>;
    /**
     * A static method that retrieves all groups.
     * @param containerId - Optional ID of a container to filter groups by. If omitted, groups from all containers are returned.
     * @platform ios
     * @returns a promise resolving to an array of [`Group`](#group) instances.
     * @example
     * ```ts
     * const allGroups = await Group.getAll();
     * ```
     */
    static getAll(containerId?: string): Promise<Group[]>;
}
export declare class FallbackGroup {
    constructor(id: string);
    readonly id: string;
    getName(): Promise<string | null>;
    setName(name: string): Promise<void>;
    addContact(contact: Contact): Promise<void>;
    removeContact(contact: Contact): Promise<void>;
    getContacts(): Promise<Contact[]>;
    delete(): Promise<void>;
    static create(name: string, containerId?: string): Promise<Group>;
    static getAll(containerId?: string): Promise<Group[]>;
}
//# sourceMappingURL=Group.d.ts.map
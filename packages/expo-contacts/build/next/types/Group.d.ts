import { Contact } from './Contact';
import { ContactQueryOptions } from './Contact.props';
export declare class Group {
    constructor(id: string);
    readonly id: string;
    getName(): Promise<string | null>;
    setName(name: string): Promise<void>;
    addContact(contact: Contact): Promise<void>;
    removeContact(contact: Contact): Promise<void>;
    getContacts(options?: ContactQueryOptions): Promise<Contact[]>;
    delete(): Promise<void>;
    static create(name: string, containerId?: string): Promise<Group>;
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
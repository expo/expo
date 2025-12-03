import { Contact } from './Contact';
import { Group } from './Group';
export type ContainerType = 'local' | 'exchange' | 'cardDAV' | 'unassigned' | 'unknown';
export declare class Container {
    constructor(id: string);
    readonly id: string;
    getName(): Promise<string | null>;
    getType(): Promise<ContainerType | null>;
    getGroups(): Promise<Group[]>;
    getContacts(): Promise<Contact[]>;
    static getAll(): Promise<Container[]>;
    static getDefault(): Promise<Container | null>;
}
export declare class FallbackContainer {
    constructor(id: string);
    readonly id: string;
    getName(): Promise<string | null>;
    getType(): Promise<ContainerType | null>;
    getGroups(): Promise<Group[]>;
    getContacts(): Promise<Contact[]>;
    static getAll(): Promise<Container[]>;
    static getDefault(): Promise<Container | null>;
}
//# sourceMappingURL=Container.d.ts.map
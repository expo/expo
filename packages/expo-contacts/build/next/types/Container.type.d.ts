import { Contact } from './Contact.type';
import { Group } from './Group.type';
export type ContainerType = 'local' | 'exchange' | 'cardDAV' | 'unassigned' | 'unknown';
export declare class Container {
    /**
     * Creates a new instance of a Container.
     * Note: Containers are read-only and usually obtained via `Container.getAll()` or `Container.getDefault()`.
     * @param id The unique identifier of the container.
     */
    constructor(id: string);
    /**
     * The unique identifier of the container.
     */
    readonly id: string;
    /**
     * Gets the name of the container (e.g., "iCloud", "Card").
     * @returns A promise resolving to the container name.
     */
    getName(): Promise<string | null>;
    /**
     * Gets the type of the container (e.g., local, exchange, cardDAV).
     * @returns A promise resolving to the container type.
     */
    getType(): Promise<ContainerType | null>;
    /**
     * Retrieves all groups belonging to this container.
     * @returns A promise resolving to an array of Group objects.
     */
    getGroups(): Promise<Group[]>;
    /**
     * Retrieves all contacts belonging to this container.
     * @returns A promise resolving to an array of Contact objects.
     */
    getContacts(): Promise<Contact[]>;
    /**
     * Retrieves all containers available on the device.
     * @returns A promise resolving to an array of Container objects.
     */
    static getAll(): Promise<Container[]>;
    /**
     * Retrieves the default container for the device.
     * This is the container where new contacts are added by default if no container ID is specified.
     * @returns A promise resolving to the default Container object, or null if not available.
     */
    static getDefault(): Promise<Container | null>;
}
export declare class FallbackContainer {
    getName(): Promise<string | null>;
    getType(): Promise<ContainerType | null>;
    getGroups(): Promise<Group[]>;
    getContacts(): Promise<Contact[]>;
    static getAll(): Promise<Container[]>;
    static getDefault(): Promise<Container | null>;
}
//# sourceMappingURL=Container.type.d.ts.map
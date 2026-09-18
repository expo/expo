export function mockProperty(object: object, property: PropertyKey, mockValue: unknown): void;
export function unmockProperty(object: object, property: PropertyKey): void;
export function unmockAllProperties(): void;
/** Mock `Linking` event listeners and return an emitter that dispatches to them. */
export function mockLinking(): (type: string, data: unknown) => void;

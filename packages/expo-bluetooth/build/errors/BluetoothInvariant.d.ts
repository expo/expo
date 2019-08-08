/**
 * Assert if the UUID isn't a valid string
 */
export declare function invariantUUID(uuid: string | undefined): void;
/**
 * Assert that the platform supports a provided native method
 */
export declare function invariantAvailability(methodName: string): void;
export declare function invariant(should: any, message: string): void;

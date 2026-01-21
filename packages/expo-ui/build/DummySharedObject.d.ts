import { SharedObject } from 'expo-modules-core';
/**
 * A dummy shared object that demonstrates how to pass shared objects as props to SwiftUI views.
 * This object contains some simple SwiftUI-related state that can be shared between JS and native.
 */
export declare class DummySharedObject extends SharedObject<{}> {
    /**
     * A simple text value stored in the shared object.
     */
    text: string;
    /**
     * A numeric counter value.
     */
    counter: number;
    /**
     * Increments the counter and returns the new value.
     */
    incrementCounter(): number;
    /**
     * Resets the counter to zero.
     */
    resetCounter(): void;
}
/**
 * Creates a direct instance of `DummySharedObject` that doesn't release automatically.
 */
export declare function createDummySharedObject(): DummySharedObject;
/**
 * Creates a `DummySharedObject`, which will be automatically cleaned up when the component is unmounted.
 * @param setup - A function that allows setting up the shared object. It will run after the object is created.
 */
export declare function useDummySharedObject(setup?: (sharedObject: DummySharedObject) => void): DummySharedObject;
//# sourceMappingURL=DummySharedObject.d.ts.map
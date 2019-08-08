/**
 * Wrap the native method and transform the errors that are returned
 *
 * @param platformModule The BLE Native method
 */
export default function platformModuleWithCustomErrors(platformModule: {
    [property: string]: any;
}): {
    [property: string]: any;
};

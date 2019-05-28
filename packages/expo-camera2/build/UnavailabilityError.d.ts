export default class UnavailabilityError extends Error {
    code: string;
    constructor(moduleName: string, propertyName: string);
}

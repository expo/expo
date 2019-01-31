declare const _default: {
    OPTIONS: {
        logLevel: string;
        errorOnMissingPlayServices: boolean;
        promptOnMissingPlayServices: boolean;
    };
    FLAGS: {
        checkedPlayServices: boolean;
    };
    STRINGS: {
        WARN_INITIALIZE_DEPRECATION: string;
        /**
         * @return {string}
         */
        readonly ERROR_MISSING_CORE: string;
        ERROR_INIT_OBJECT: string;
        ERROR_INIT_STRING_NAME: string;
        /**
         * @return {string}
         */
        ERROR_INIT_SERVICE_URL_UNSUPPORTED(namespace: string): string;
        /**
         * @return {string}
         */
        ERROR_MISSING_CB(method: string): string;
        /**
         * @return {string}
         */
        ERROR_MISSING_ARG(type: string, method: string): string;
        /**
         * @return {string}
         */
        ERROR_MISSING_ARG_NAMED(name: string, type: string, method: string): string;
        /**
         * @return {string}
         */
        ERROR_ARG_INVALID_VALUE(name: string, expected: string, got: string): string;
        /**
         * @return {string}
         */
        ERROR_PROTECTED_PROP(name: string): string;
        ERROR_MISSING_IMPORT(name: string): string;
        /**
         * @return {string}
         * @param namespace
         * @param nativeModule
         */
        ERROR_MISSING_MODULE(namespace: string, nativeModule: string): string;
        /**
         * @return {string}
         */
        ERROR_APP_NOT_INIT(appName: string): string;
        /**
         * @param optName
         * @return {string}
         * @constructor
         */
        ERROR_MISSING_OPT(optName: string): string;
        /**
         * @return {string}
         */
        ERROR_NOT_APP(namespace: string): string;
        /**
         * @return {string}
         */
        ERROR_UNSUPPORTED_CLASS_METHOD(className: string, method: string): string;
        /**
         * @return {string}
         */
        ERROR_UNSUPPORTED_CLASS_PROPERTY(className: string, property: string): string;
        /**
         * @return {string}
         */
        ERROR_UNSUPPORTED_MODULE_METHOD(namespace: string, method: string): string;
        /**
         * @return {string}
         */
        ERROR_PLAY_SERVICES(statusCode: number): string;
    };
};
export default _default;

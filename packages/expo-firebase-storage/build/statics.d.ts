declare const statics: {
    TaskEvent: {
        STATE_CHANGED: string;
    };
    TaskState: {
        RUNNING: string;
        PAUSED: string;
        SUCCESS: string;
        CANCELLED: string;
        ERROR: string;
    };
    Native: {
        MAIN_BUNDLE_PATH: string;
        CACHES_DIRECTORY_PATH: string;
        DOCUMENT_DIRECTORY_PATH: string;
        EXTERNAL_DIRECTORY_PATH: string;
        EXTERNAL_STORAGE_DIRECTORY_PATH: string;
        TEMP_DIRECTORY_PATH: string;
        LIBRARY_DIRECTORY_PATH: string;
        FILETYPE_REGULAR: string;
        FILETYPE_DIRECTORY: string;
    } | {
        MAIN_BUNDLE_PATH?: undefined;
        CACHES_DIRECTORY_PATH?: undefined;
        DOCUMENT_DIRECTORY_PATH?: undefined;
        EXTERNAL_DIRECTORY_PATH?: undefined;
        EXTERNAL_STORAGE_DIRECTORY_PATH?: undefined;
        TEMP_DIRECTORY_PATH?: undefined;
        LIBRARY_DIRECTORY_PATH?: undefined;
        FILETYPE_REGULAR?: undefined;
        FILETYPE_DIRECTORY?: undefined;
    };
};
export default statics;

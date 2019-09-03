import * as types from './SQLite.types';
declare const SQLite: {
    SQLError: typeof types.SQLError;
    SQLException: typeof types.SQLException;
    openDatabase: typeof import("./SQLite").openDatabase;
};
export { SQLite };

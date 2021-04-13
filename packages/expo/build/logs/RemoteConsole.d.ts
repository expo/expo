/**
 * Creates a console object that delegates calls to the specified underlying console and also sends
 * the messages to the development environment over a remote connection.
 */
export declare function createRemoteConsole(originalConsole: Console): Console;

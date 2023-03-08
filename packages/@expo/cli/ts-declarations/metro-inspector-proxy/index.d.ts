declare module 'metro-inspector-proxy/src/Device' {
  import { Device } from 'metro-inspector-proxy';
  export = Device;
}

declare module 'metro-inspector-proxy' {
  import WS from 'ws';
  import type { Server as HttpsServer } from 'https';
  import type {
    IncomingMessage as HttpRequest,
    ServerResponse as HttpResponse,
    Server as HttpServer,
  } from 'http';

  type Middleware = (error?: Error) => any;

  /**
   * Page information received from the device. New page is created for
   * each new instance of VM and can appear when user reloads React Native
   * application.
   */
  type Page = {
    id: string;
    title: string;
    vm: string;
    app: string;

    // Allow objects too
    [key: string]: string;
  };

  type DebuggerInfo = {
    // Debugger web socket connection
    socket: WS;
    // If we replaced address (like '10.0.2.2') to localhost we need to store original
    // address because Chrome uses URL or urlRegex params (instead of scriptId) to set breakpoints.
    originalSourceURLAddress?: string;
    prependedFilePrefix: boolean;
    pageId: string;

    // Allow objects too
    [key: string]: string;
  };

  type PageDescription = any;

  function runInspectorProxy(port: number, projectRoot: string): void;

  class InspectorProxy {
    /** Root of the project used for relative to absolute source path conversion. */
    _projectRoot: string;
    /** Maps device ID to Device instance. */
    _devices: Map<number, Device>;
    /** Internal counter for device IDs -- just gets incremented for each new device. */
    _deviceCounter: number = 0;

    /**
     * We store server's address with port (like '127.0.0.1:8081') to be able to build URLs
     * (devtoolsFrontendUrl and webSocketDebuggerUrl) for page descriptions. These URLs are used
     * by debugger to know where to connect.
     */
    _serverAddressWithPort: string = '';

    constructor(projectRoot: string);

    /**
     * Process HTTP request sent to server. We only respond to 2 HTTP requests:
     * 1. /json/version returns Chrome debugger protocol version that we use
     * 2. /json and /json/list returns list of page descriptions (list of inspectable apps).
     * This list is combined from all the connected devices.
     */
    processRequest(req: HttpRequest, res: HttpResponse, next: Middleware): void;

    /** Adds websocket listeners to the provided HTTP/HTTPS server. */
    createWebSocketListeners(server: HttpServer | HttpsServer): Record<string, WS.Server>;

    /** Converts page information received from device into PageDescription object that is sent to debugger. */
    _buildPageDescription(deviceId: number, device: Device, page: Page): PageDescription;

    /**
     * Sends object as response to HTTP request.
     * Just serializes object using JSON and sets required headers.
     */
    _sendJsonResponse(response: ServerResponse, object: any): void;

    /**
     * Adds websocket handler for device connections.
     * Device connects to /inspector/device and passes device and app names as
     * HTTP GET params.
     * For each new websocket connection we parse device and app names and create
     * new instance of Device class.
     */
    _createDeviceConnectionWSServer(): WS.Server;

    /**
     * Returns websocket handler for debugger connections.
     * Debugger connects to webSocketDebuggerUrl that we return as part of page description
     * in /json response.
     * When debugger connects we try to parse device and page IDs from the query and pass
     * websocket object to corresponding Device instance.
     */
    _createDebuggerConnectionWSServer(): WS.Server;
  }

  class Device {
    /** ID of the device. */
    _id: number;
    /** Name of the device. */
    _name: string;
    /** Package name of the app. */
    _app: string;
    /** Stores socket connection between Inspector Proxy and device. */
    _deviceSocket: WS;
    /** Stores last list of device's pages. */
    _pages: Page[];
    /** Stores information about currently connected debugger (if any). */
    _debuggerConnection: DebuggerInfo | null = null;
    /** Whether we are in the middle of a reload in the REACT_NATIVE_RELOADABLE_PAGE. */
    _isReloading: boolean = false;
    /** The previous "GetPages" message, for deduplication in debug logs. */
    _lastGetPagesMessage: string = '';
    /** Mapping built from scriptParsed events and used to fetch file content in `Debugger.getScriptSource`. */
    _scriptIdToSourcePathMapping: Map<string, string>;
    /** Root of the project used for relative to absolute source path conversion. */
    _projectRoot: string;

    /**
     * Last known Page ID of the React Native page.
     * This is used by debugger connections that don't have PageID specified
     * (and will interact with the latest React Native page).
     */
    _lastConnectedReactNativePage: Page | null = null;

    constructor(id: number, name: string, app: string, socket: WS, projectRoot: string);

    getName(): string;
    getPagesList(): Page[];

    /**
     * Handles new debugger connection to this device:
     * 1. Sends connect event to device
     * 2. Forwards all messages from the debugger to device as wrappedEvent
     * 3. Sends disconnect event to device when debugger connection socket closes.
     */
    handleDebuggerConnection(socket: WS, pageId: string): void;

    /**
     * Handles messages received from device:
     * 1. For getPages responses updates local _pages list.
     * 2. All other messages are forwarded to debugger as wrappedEvent.
     *
     * In the future more logic will be added to this method for modifying
     * some of the messages (like updating messages with source maps and file locations).
     */
    _handleMessageFromDevice(message: MessageFromDevice): void;

    /** Sends single message to device. */
    _sendMessageToDevice(message: MessageToDevice): void;

    /** Sends 'getPages' request to device every PAGES_POLLING_INTERVAL milliseconds.*/
    _setPagesPolling(): void;

    /** Allows to make changes in incoming message from device. */
    _processMessageFromDevice(
      payload: { method: string; params: { sourceMapURL: string; url: string } },
      debuggerInfo: DebuggerInfo
    ): void;

    /** Allows to make changes in incoming messages from debugger. */
    _interceptMessageFromDebugger(
      request: DebuggerRequest,
      debuggerInfo: DebuggerInfo,
      socket: WS
    ): DebuggerResponse | null;

    // _newReactNativePage
    // _processDebuggerSetBreakpointByUrl
    // _processDebuggerGetScriptSource
    // _mapToDevicePageId
  }
}

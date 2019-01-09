export var CentralState;
(function (CentralState) {
    CentralState["Unknown"] = "unknown";
    CentralState["Resetting"] = "resetting";
    CentralState["Unsupported"] = "unsupported";
    CentralState["Unauthorized"] = "unauthorized";
    CentralState["PoweredOff"] = "poweredOff";
    CentralState["PoweredOn"] = "poweredOn";
})(CentralState || (CentralState = {}));
export var PeripheralState;
(function (PeripheralState) {
    PeripheralState["Disconnected"] = "disconnected";
    PeripheralState["Connecting"] = "connecting";
    PeripheralState["Connected"] = "connected";
    PeripheralState["Disconnecting"] = "disconnecting";
    PeripheralState["Unknown"] = "unknown";
})(PeripheralState || (PeripheralState = {}));
export var TransactionType;
(function (TransactionType) {
    TransactionType["get"] = "get";
    TransactionType["read"] = "read";
    TransactionType["write"] = "write";
    TransactionType["connect"] = "connect";
    TransactionType["disconnect"] = "disconnect";
    TransactionType["scan"] = "scan";
})(TransactionType || (TransactionType = {}));
//# sourceMappingURL=Bluetooth.types.js.map
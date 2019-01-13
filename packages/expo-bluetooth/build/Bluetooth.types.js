export var CentralState;
(function (CentralState) {
    CentralState["Unknown"] = "unknown";
    CentralState["Resetting"] = "resetting";
    CentralState["Unsupported"] = "unsupported";
    CentralState["Unauthorized"] = "unauthorized";
    CentralState["PoweredOff"] = "poweredOff";
    CentralState["PoweredOn"] = "poweredOn";
})(CentralState || (CentralState = {}));
export var AndroidCentralState;
(function (AndroidCentralState) {
    AndroidCentralState["poweringOff"] = "poweringOff";
    AndroidCentralState["poweredOff"] = "poweredOff";
    AndroidCentralState["poweringOn"] = "poweringOn";
    AndroidCentralState["poweredOn"] = "poweredOn";
    AndroidCentralState["unknown"] = "unknown";
})(AndroidCentralState || (AndroidCentralState = {}));
export var PeripheralState;
(function (PeripheralState) {
    PeripheralState["Disconnected"] = "disconnected";
    PeripheralState["Connecting"] = "connecting";
    PeripheralState["Connected"] = "connected";
    PeripheralState["Disconnecting"] = "disconnecting";
    PeripheralState["Unknown"] = "unknown";
})(PeripheralState || (PeripheralState = {}));
export var AndroidAdapterScanMode;
(function (AndroidAdapterScanMode) {
    AndroidAdapterScanMode["none"] = "none";
    AndroidAdapterScanMode["connectable"] = "connectable";
    AndroidAdapterScanMode["discoverable"] = "discoverable";
})(AndroidAdapterScanMode || (AndroidAdapterScanMode = {}));
export var AndroidScanMode;
(function (AndroidScanMode) {
    AndroidScanMode["lowLatency"] = "lowLatency";
    AndroidScanMode["lowPower"] = "lowPower";
    AndroidScanMode["balanced"] = "balanced";
    AndroidScanMode["opportunistic"] = "opportunistic";
})(AndroidScanMode || (AndroidScanMode = {}));
export var TransactionType;
(function (TransactionType) {
    TransactionType["get"] = "get";
    TransactionType["read"] = "read";
    TransactionType["write"] = "write";
    TransactionType["connect"] = "connect";
    TransactionType["disconnect"] = "disconnect";
    TransactionType["scan"] = "scan";
})(TransactionType || (TransactionType = {}));
export var CharacteristicProperty;
(function (CharacteristicProperty) {
    CharacteristicProperty["Broadcast"] = "broadcast";
    CharacteristicProperty["WriteWithoutResponse"] = "writeWithoutResponse";
    CharacteristicProperty["Write"] = "write";
    CharacteristicProperty["Notify"] = "notify";
    CharacteristicProperty["Indicate"] = "indicate";
    CharacteristicProperty["AutheticateSignedWrites"] = "autheticateSignedWrites";
    CharacteristicProperty["ExtendedProperties"] = "extendedProperties";
    CharacteristicProperty["NotifyEncryptionRequired"] = "notifyEncryptionRequired";
    CharacteristicProperty["IndicateEncryptionRequired"] = "indicateEncryptionRequired";
})(CharacteristicProperty || (CharacteristicProperty = {}));
//# sourceMappingURL=Bluetooth.types.js.map
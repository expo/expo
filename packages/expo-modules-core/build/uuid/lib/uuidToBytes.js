function hexToByte(hex) {
    return parseInt(hex, 16);
}
function uuidToBytes(uuid) {
    // Strip the UUID of its hypens
    const strippedUuid = uuid.replace(/-/g, '');
    // Ensure the UUID is 32 characters long
    if (strippedUuid.length !== 32) {
        throw new Error('Invalid UUID format');
    }
    const bytes = [];
    for (let i = 0; i < 32; i += 2) {
        // Convert each 2-character byte back to a number
        bytes.push(hexToByte(strippedUuid.substr(i, 2)));
    }
    return bytes;
}
export default uuidToBytes;
//# sourceMappingURL=uuidToBytes.js.map
// Temporary for SDK 40 until we make our own native implementation
import Clipboard from 'react-native/Libraries/Components/Clipboard/Clipboard';
export default {
    async getStringAsync() {
        return await Clipboard.getString();
    },
    async setStringAsync(text) {
        const success = Clipboard.setString(text);
        return success;
    },
};
//# sourceMappingURL=ExpoClipboard.js.map
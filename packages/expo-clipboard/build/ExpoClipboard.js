// Temporary for SDK 40 until we make our own native implementation
import Clipboard from 'react-native/Libraries/Components/Clipboard/Clipboard';
export default {
    async getStringAsync() {
        return await Clipboard.getString();
    },
    setString(text) {
        Clipboard.setString(text);
    },
};
//# sourceMappingURL=ExpoClipboard.js.map
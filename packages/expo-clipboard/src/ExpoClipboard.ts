// Temporary for SDK 40 until we make our own native implementation
import Clipboard from 'react-native/Libraries/Components/Clipboard/Clipboard';

export default {
  async getStringAsync(): Promise<string> {
    return await Clipboard.getString();
  },
  setString(text: string): void {
    Clipboard.setString(text);
  },
};

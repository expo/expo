export default () => {
    // @ts-ignore
    self.importScripts('https://unpkg.com/jsqr@1.2.0/dist/jsQR.js');
    self.addEventListener('message', function (e) {
        if (!e)
            return;
        if (e.data && e.data.module === 'expo-barcode-scanner') {
            const { payload = {} } = e.data;
            let results = [];
            const { image, types, options } = payload;
            if (!image || !Array.isArray(types)) {
                // @ts-ignore
                postMessage(results);
                return;
            }
            for (const type of types) {
                switch (type) {
                    // TODO: Bacon: Add pdf417
                    case 'qr':
                        {
                            // @ts-ignore
                            const decoded = jsQR(image.data, image.width, image.height, options);
                            if (decoded) {
                                decoded.type = type;
                                results.push(decoded);
                            }
                        }
                        break;
                    default:
                        // throw new Error('Unsupported barcode type: ' + type);
                        break;
                }
            }
            // @ts-ignore
            postMessage(results);
        }
    });
};
//# sourceMappingURL=BarcodeScannerWorker.js.map
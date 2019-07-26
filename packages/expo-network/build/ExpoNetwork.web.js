export default {
    get name() {
        return 'ExpoNetwork';
    },
    async getIpAddressAsync() {
        try {
            return new Promise((resolve, reject) => {
                fetch('https://api.ipify.org?format=json')
                    .then(data => {
                    data.json().then(json => {
                        resolve(json.ip);
                    });
                })
                    .catch(err => {
                    reject(err);
                });
            });
        }
        catch (err) {
            console.log(err);
            return new Promise((resolve, reject) => {
                reject(err);
            });
        }
    },
};
//# sourceMappingURL=ExpoNetwork.web.js.map
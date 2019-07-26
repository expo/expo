export default {
    async getIpAddressAsync() {
        return new Promise((resolve, reject) => {
            fetch('https://api.ipify.org?format=json')
                .then(data => {
                data.json().then(result => {
                    resolve(result.ip);
                });
            })
                .catch(err => {
                reject(err);
            });
        });
    },
};
//# sourceMappingURL=ExpoNetwork.web.js.map
export default {
  async getIpAddressAsync(): Promise<string> {
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

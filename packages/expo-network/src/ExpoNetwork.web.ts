export default {
  get name(): string {
    return 'ExpoNetwork';
  },
  async getIpAddressAsync(): Promise<string> {
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
    } catch (err) {
      console.log(err);
      return new Promise((resolve, reject) => {
        reject(err);
      });
    }
  },
};

const mockResult = {
  address: '100.100.1.100',
  gateway: '192.168.1.10',
  iname: 'mock0',
  netmask: '192.168.1.0',
  mac: '00:00:00:00:00:00',
  internal: true,
  cidr: '192.168.1.0/24',
  family: 'IPv4',
};

module.exports = {
  lanNetworkSync() {
    return mockResult;
  },
  async lanNetwork() {
    return mockResult;
  },
};

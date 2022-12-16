const os = jest.requireActual('os');

os.homedir = jest.fn(() => '/home');

module.exports = os;

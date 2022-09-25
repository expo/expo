const os = jest.requireActual('os');

os.homedir = jest.fn(() => '/home');
os.tmpdir = jest.fn(() => '/tmp');

module.exports = os;

import { isIPv4 } from 'node:net';
import { spawnSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { dirname, basename } from 'node:path';
import internalIp from 'internal-ip';

/** Gets a route address by opening a UDP socket to a publicly routed address.
  * @privateRemarks
  * This is wrapped in `spawnSync` since the original `getIpAddress` utility exported
  * in this module is used synchronosly. An appropriate timeout has been set and UDP
  * ports don't send a message when opened.
  */
function getRouteAddress(): string | null {
  const command = process.platform === 'win32' ? basename(process.execPath) : process.execPath;
  const { error, status, stdout } = spawnSync(command, ['-'], {
    // This should be the cheapest method to determine the default route
    // By opening a socket to a publicly routed IP address, we let the default
    // gateway handle this socket, which means the socket's address will be
    // the prioritised route for public IP addresses.
    // It might fall back to `"0.0.0.0"` when no network connection is established
    input: `
      var socket = require('dgram').createSocket({ type: 'udp4', reuseAddr: true });
      socket.unref();
      socket.connect(53, '1.1.1.1', function() {
        var address = socket.address();
        socket.close();
        if (address && 'address' in address) {
          process.stdout.write(address.address);
          process.exit(0);
        } else {
          process.exit(1);
        }
      });
    `,
    cwd: dirname(process.execPath),
    shell: false,
    timeout: 500,
    encoding: 'utf8',
    windowsVerbatimArguments: true,
    windowsHide: true,
  });
  // We only use the stdout as an IP, if it validates as an IP and we got a zero exit code
  if (status || error) {
    return null;
  } else if (!status && typeof stdout === 'string' && isIPv4(stdout.trim())) {
    return stdout.trim();
  } else {
    return null;
  }
}

/** Determines the internal IP address by opening a socket, then checking the socket address against non-internal network interface assignments
  * @throws If no address can be determined.
  */
function getIPAddress(): string | null {
  // We check the IP address we get against the available network interfaces
  // It's only an internal IP address if we have a matching address on an interface's IP assignment
  const routeAddress = getRouteAddress();
  if (!routeAddress) {
    return null;
  }
  const ifaces = networkInterfaces();
  for (const iface in ifaces) {
    const assignments = ifaces[iface];
    for (let i = 0; assignments && i < assignments.length; i++) {
      const assignment = assignments[i];
      // Only use IPv4 assigments that aren't internal
      if (assignment.family === 'IPv4' && !assignment.internal && assignment.address === routeAddress)
        return routeAddress;
    }
  }
  return null;
}

export function getIpAddress(): string {
  return internalIp.v4.sync() || getIPAddress() || '127.0.0.1';
}

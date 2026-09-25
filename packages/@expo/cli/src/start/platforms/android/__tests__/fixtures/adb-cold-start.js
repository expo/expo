process.stdout.write('List of devices attached\nUSB-1 device usb:1 model:Pixel transport_id:4\n');
process.stderr.write(
  '* daemon not running; starting now at tcp:5037\n' +
    '* daemon started successfully\n' +
    'adb D adb_client.cpp:393] adb_query: host:devices-l\n'
);

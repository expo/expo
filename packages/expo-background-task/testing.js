console.log('Starting to test expo-background-task');
setTimeout(() => {
  if (process.argv[2] === 'fail') {
    console.log('Testing expo-background-task failed');
    process.exit(1);
  } else if (process.argv[2] === 'fail++') {
    console.error('Testing expo-background-task failed');
    process.exit(1);
  } else if (process.argv[2] === 'fail--') {
    throw new Error('Testing expo-background-task failed');
  } else if (process.argv[2] === 'test') {
    console.log('Finished testing expo-background-task');
  } else if (process.argv[2] === 'params') {
    console.log('Params provided:', process.argv[3]);
  } else if (process.argv[2] === 'json') {
    console.log(
      JSON.stringify([
        { type: 'text', text: 'This is an info text', level: 'info' },
        { type: 'text', text: 'This is a warning', level: 'warning' },
        { type: 'text', text: 'This is an error', level: 'error' },
        { type: 'text', text: 'This is a link', level: 'info', url: 'https://example.com' },
        { type: 'image', url: 'https://example.com/image.png', text: 'Example image' },
      ])
    );
  } else if (process.argv[2] === 'json--') {
    console.error(
      JSON.stringify([
        { type: 'text', text: 'This is an info text', level: 'info' },
        { type: 'text', text: 'This is a warning', level: 'warning' },
        { type: 'text', text: 'This is an error', level: 'error' },
        { type: 'image', url: 'https://example.com/image.png', text: 'Example image' },
      ])
    );
    process.exit(1);
  } else {
    console.error('Finished testing expo-background-task');
  }
}, 1250);

export default function (cmd) {
    if (cmd === 'list') {
        return new Promise(async (resolve) => {
            // Simulate triggering a background task
            resolve('1. Task A\n2. Task B\n3. Task C');
        });
    }
    else if (cmd === 'test') {
        console.log('Triggering background tasks for testing...');
        return new Promise((resolve) => {
            // Simulate triggering a background task
            setTimeout(() => {
                resolve('Background task completed successfully.');
            }, 1000);
        });
    }
    else {
        return Promise.resolve("Unknown command. Use 'list' to see available tasks or 'trigger' to run a task.");
    }
}
//# sourceMappingURL=index.js.map
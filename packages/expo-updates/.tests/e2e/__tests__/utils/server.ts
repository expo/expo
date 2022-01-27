import express from 'express';

const app: any = express();
let server: any;

let notifyString: string | null = null;
app.get('/notify/:string', (req: any) => {
  notifyString = req.params.string;
})

export function start(port: number) {
  if (!server) {
    server = app.listen(port);
  }
}

export function stop() {
  if (server) {
    server.close();
    server = null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForResponse(timeout: number) {
  let delayLength = 0;
  while (!notifyString) {
    delayLength += 50;
    if (delayLength > timeout) {
      throw new Error('Timed out waiting for response')
    }
    await delay(50);
  }
  
  const response = notifyString;
  notifyString = null;
  return response;
}

// const notifyPath = '/notify/:string'

// function resetNotifyRouter() {
//   console.log('resetNotifyRouter')
//   const { stack } = app._router;
//   for (let i = 0; i < stack.length; i++) {
//     const { route } = stack[i];
//     if (route?.path === notifyPath) {
//       stack.splice(i, 1);
//       break;
//     }
//   }
// }

// export async function waitForResponse(timeout: number): Promise<string> {
//   console.log('waitForResponse')
//   const responsePromise = new Promise((resolve) => {
//     app.get(notifyPath, (req: any, res: any) => {
//       const { string } = req.params;
//       console.log('received', string);
//       res.status(200).send('Received');
//       resetNotifyRouter();
//       resolve(string);
//     });
//   });
//   const delayPromise = new Promise((resolve, reject) =>
//     setTimeout(() => {
//       resetNotifyRouter();
//       reject('Timed out waiting for response');
//     }, timeout)
//   );
//   return Promise.race([responsePromise, delayPromise]) as Promise<string>;
// }

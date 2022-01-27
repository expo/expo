const express = require('express')
const app = express()
const port = 4747

app.get('/notify/:string', (req, res) => {
  console.log('handler 1')
  res.send('Hello World!')
})

const { stack } = app._router;
for (let i = 0; i < stack.length; i++) {
  const { route } = stack[i];
  if (route && route.path === '/notify/:string') {
    stack.splice(i, 1);
    break;
  }
}

app.get('/notify/:string', (req, res) => {
  console.log('handler 2')
  res.send('Hello World2!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

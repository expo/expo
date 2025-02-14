self.onmessage = (event) => {
  const { data } = event;
  const result = data * 2; // Example: double the number
  postMessage(result);
};

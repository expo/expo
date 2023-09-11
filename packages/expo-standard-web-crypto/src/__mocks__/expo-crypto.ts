export const getRandomValues = jest.fn((inputArray) => {
  inputArray.forEach((_, index) => (inputArray[index] = Math.random() * 256));
});

export const getRandomValues = jest.fn((inputArray: number[]) => {
  inputArray.forEach((_, index) => (inputArray[index] = Math.random() * 256));
});

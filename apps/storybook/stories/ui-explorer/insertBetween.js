const insertBetween = (item, array) =>
  array.reduce((acc, curr, i, { length }) => {
    if (i && i < length) {
      return [...acc, item(), curr];
    }
    return [...acc, curr];
  }, []);

export default insertBetween;

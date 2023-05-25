function oxfordComma(arr) {
  if (arr.length === 1) {
    return arr[0];
  } else if (arr.length === 2) {
    return arr.join(' and ');
  } else {
    const last = arr.pop();
    return arr.join(', ') + ', and ' + last;
  }
}

module.exports = {
  oxfordComma,
};

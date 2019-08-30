export default {
  getPointOptions(category) {
    // return array of possible values
    let ops = []; // 0 is always an option
    if (category.options) {
      ops = [...ops, ...category.options];
    } else {
      // 5 thru 29
      const arr5thru29 = Array.from(Array(30 - 5), (_, x) => x + 5);
      ops = [...ops, ...arr5thru29];
    }
    ops = ops.reverse();
    ops.push(0);
    // console.log(ops);
    return ops;
  },
};

export default {
  choice(items) {
    return items[Math.floor(Math.random() * items.length)];
  },
  smartChoice(items) {
    // assumes there is an array of [{value: '', count: 0}]
    const min = items.reduce((prev, current) => ((prev.count < current.count) ? prev : current)).count;
    const minItems = items.filter(x => x.count === min);
    const randomValue = minItems[Math.floor(Math.random() * minItems.length)].value;
    console.log('smartChoice', min, minItems, randomValue);
    // todo: update
    for (let x = 0; x < items.length; x += 1) {
      if (items[x].value === randomValue) {
        // eslint-disable-next-line
        items[x].count += 1;
      }
    }
    return randomValue;
  },
  convertArrayToSmartArray(items) {
    return items.map(item => ({ value: item, count: 0 }));
  },
};

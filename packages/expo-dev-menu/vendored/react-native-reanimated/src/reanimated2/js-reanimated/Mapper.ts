// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import MutableValue from './MutableValue';

export default class Mapper {
  static MAPPER_ID = 1;

  dirty = true;

  constructor(module, mapper, inputs = [], outputs = []) {
    this.id = Mapper.MAPPER_ID++;
    this.inputs = this.extractMutablesFromArray(inputs);
    this.outputs = this.extractMutablesFromArray(outputs);
    this.mapper = mapper;

    const markDirty = () => {
      this.dirty = true;
      module.maybeRequestRender();
    };

    this.inputs.forEach((input) => {
      input.addListener(markDirty);
    });
  }

  execute() {
    this.dirty = false;
    this.mapper();
  }

  extractMutablesFromArray(array) {
    const res = [];

    function extractMutables(value) {
      if (value instanceof MutableValue) {
        res.push(value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => extractMutables(v));
      } else if (typeof value === 'object') {
        Object.keys(value).forEach((key) => {
          extractMutables(value[key]);
        });
      }
    }

    extractMutables(array);
    return res;
  }
}

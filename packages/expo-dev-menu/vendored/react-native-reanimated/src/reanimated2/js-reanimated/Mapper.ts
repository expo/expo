import { NestedObjectValues } from '../commonTypes';
import { JSReanimated } from './commonTypes';
import MutableValue from './MutableValue';

export default class Mapper<T> {
  static MAPPER_ID = 1;
  id: number;
  inputs: MutableValue<T>[];
  outputs: MutableValue<T>[];
  mapper: () => void;

  dirty = true;

  constructor(
    module: JSReanimated,
    mapper: () => void,
    inputs: NestedObjectValues<MutableValue<T>>[] = [],
    outputs: NestedObjectValues<MutableValue<T>>[] = []
  ) {
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

  execute(): void {
    this.dirty = false;
    this.mapper();
  }

  extractMutablesFromArray<T>(
    array: NestedObjectValues<MutableValue<T>>
  ): MutableValue<T>[] {
    const res: MutableValue<T>[] = [];

    function extractMutables(value: NestedObjectValues<MutableValue<T>>) {
      if (value == null) {
        // return;
      } else if (value instanceof MutableValue) {
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

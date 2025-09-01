import {test1, test2, test3, test4, test5, test6, test7, test8, test9} from 'anywhere';

class Example {
  #test1 = test1;
  test2 = test2;
  #test3() { return test3; }
  test4() { return test4; }
  get #test5() { return test5; }
  get test6() { return test6; }

  #test7 = this.#test1;
  #test8() { return this.#test3(); }
  get #test9() { return this.#test5(); }
}

package com.swmansion.reanimated.nodes;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableMap;
import com.swmansion.reanimated.NodesManager;
import com.swmansion.reanimated.Utils;

public class OperatorNode extends Node {

  private static boolean truthy(Object value) {
    return value != null && !value.equals(0.);
  }

  private interface Operator {
    double evaluate(Node[] input);
  }

  private abstract static class ReduceOperator implements Operator {
    @Override
    public double evaluate(Node[] input) {
      double acc = input[0].doubleValue();
      for (int i = 1; i < input.length; i++) {
        acc = reduce(acc, input[i].doubleValue());
      }
      return acc;
    }

    public abstract double reduce(Double x, Double y);
  }

  private abstract static class SingleOperator implements Operator {
    @Override
    public double evaluate(Node[] input) {
      return eval((Double) input[0].value());
    }

    public abstract double eval(Double x);
  }

  private abstract static class CompOperator implements Operator {
    @Override
    public double evaluate(Node[] input) {
      return eval((Double) input[0].value(), (Double) input[1].value()) ? 1. : 0.;
    }

    public abstract boolean eval(Double x, Double y);
  }

  // arithmetic
  private static final Operator ADD =
      new ReduceOperator() {
        @Override
        public double reduce(Double x, Double y) {
          return x + y;
        }
      };
  private static final Operator SUB =
      new ReduceOperator() {
        @Override
        public double reduce(Double x, Double y) {
          return x - y;
        }
      };
  private static final Operator MULTIPLY =
      new ReduceOperator() {
        @Override
        public double reduce(Double x, Double y) {
          return x * y;
        }
      };
  private static final Operator DIVIDE =
      new ReduceOperator() {
        @Override
        public double reduce(Double x, Double y) {
          return x / y;
        }
      };
  private static final Operator POW =
      new ReduceOperator() {
        @Override
        public double reduce(Double x, Double y) {
          return Math.pow(x, y);
        }
      };
  private static final Operator MODULO =
      new ReduceOperator() {
        @Override
        public double reduce(Double x, Double y) {
          return ((x % y) + y) % y;
        }
      };
  private static final Operator SQRT =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.sqrt(x);
        }
      };
  private static final Operator LOG =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.log(x);
        }
      };
  private static final Operator SIN =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.sin(x);
        }
      };
  private static final Operator COS =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.cos(x);
        }
      };
  private static final Operator TAN =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.tan(x);
        }
      };
  private static final Operator ACOS =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.acos(x);
        }
      };
  private static final Operator ASIN =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.asin(x);
        }
      };
  private static final Operator ATAN =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.atan(x);
        }
      };
  private static final Operator EXP =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.exp(x);
        }
      };
  private static final Operator ROUND =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.round(x);
        }
      };
  private static final Operator ABS =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.abs(x);
        }
      };
  private static final Operator FLOOR =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.floor(x);
        }
      };
  private static final Operator CEIL =
      new SingleOperator() {
        @Override
        public double eval(Double x) {
          return Math.ceil(x);
        }
      };
  private static final Operator MIN =
      new ReduceOperator() {
        @Override
        public double reduce(Double x, Double y) {
          return Math.min(x, y);
        }
      };
  private static final Operator MAX =
      new ReduceOperator() {
        @Override
        public double reduce(Double x, Double y) {
          return Math.max(x, y);
        }
      };

  // logical
  private static final Operator AND =
      new Operator() {
        @Override
        public double evaluate(Node[] input) {
          boolean res = truthy(input[0].value());
          for (int i = 1; i < input.length && res; i++) {
            res = res && truthy(input[i].value());
          }
          return res ? 1. : 0.;
        }
      };
  private static final Operator OR =
      new Operator() {
        @Override
        public double evaluate(Node[] input) {
          boolean res = truthy(input[0].value());
          for (int i = 1; i < input.length && !res; i++) {
            res = res || truthy(input[i].value());
          }
          return res ? 1. : 0.;
        }
      };
  private static final Operator NOT =
      new Operator() {
        @Override
        public double evaluate(Node[] input) {
          return truthy(input[0].value()) ? 0. : 1.;
        }
      };
  private static final Operator DEFINED =
      new Operator() {
        @Override
        public double evaluate(Node[] input) {
          Object res = input[0].value();
          return (res != null && !(res instanceof Double && ((Double) res).isNaN())) ? 1. : 0.;
        }
      };

  // comparison
  private static final Operator LESS_THAN =
      new CompOperator() {
        @Override
        public boolean eval(Double x, Double y) {
          if (x == null || y == null) {
            return false;
          }
          return x < y;
        }
      };
  private static final Operator EQ =
      new CompOperator() {
        @Override
        public boolean eval(Double x, Double y) {
          if (x == null || y == null) {
            return x == y;
          }
          return x.doubleValue() == y.doubleValue();
        }
      };
  private static final Operator GREATER_THAN =
      new CompOperator() {
        @Override
        public boolean eval(Double x, Double y) {
          if (x == null || y == null) {
            return false;
          }
          return x > y;
        }
      };
  private static final Operator LESS_OR_EQ =
      new CompOperator() {
        @Override
        public boolean eval(Double x, Double y) {
          return x <= y;
        }
      };
  private static final Operator GREATER_OR_EQ =
      new CompOperator() {
        @Override
        public boolean eval(Double x, Double y) {
          return x >= y;
        }
      };
  private static final Operator NEQ =
      new CompOperator() {
        @Override
        public boolean eval(Double x, Double y) {
          if (x == null || y == null) {
            return x == y;
          }
          return x.doubleValue() != y.doubleValue();
        }
      };

  private final int[] mInputIDs;
  private final Node[] mInputNodes;
  private final Operator mOperator;

  public OperatorNode(int nodeID, ReadableMap config, NodesManager nodesManager) {
    super(nodeID, config, nodesManager);
    mInputIDs = Utils.processIntArray(config.getArray("input"));
    mInputNodes = new Node[mInputIDs.length];

    String op = config.getString("op");
    if ("add".equals(op)) {
      mOperator = ADD;
    } else if ("sub".equals(op)) {
      mOperator = SUB;
    } else if ("multiply".equals(op)) {
      mOperator = MULTIPLY;
    } else if ("divide".equals(op)) {
      mOperator = DIVIDE;
    } else if ("pow".equals(op)) {
      mOperator = POW;
    } else if ("modulo".equals(op)) {
      mOperator = MODULO;
    } else if ("sqrt".equals(op)) {
      mOperator = SQRT;
    } else if ("log".equals(op)) {
      mOperator = LOG;
    } else if ("sin".equals(op)) {
      mOperator = SIN;
    } else if ("cos".equals(op)) {
      mOperator = COS;
    } else if ("tan".equals(op)) {
      mOperator = TAN;
    } else if ("acos".equals(op)) {
      mOperator = ACOS;
    } else if ("asin".equals(op)) {
      mOperator = ASIN;
    } else if ("atan".equals(op)) {
      mOperator = ATAN;
    } else if ("exp".equals(op)) {
      mOperator = EXP;
    } else if ("round".equals(op)) {
      mOperator = ROUND;
    } else if ("and".equals(op)) {
      mOperator = AND;
    } else if ("or".equals(op)) {
      mOperator = OR;
    } else if ("not".equals(op)) {
      mOperator = NOT;
    } else if ("defined".equals(op)) {
      mOperator = DEFINED;
    } else if ("lessThan".equals(op)) {
      mOperator = LESS_THAN;
    } else if ("eq".equals(op)) {
      mOperator = EQ;
    } else if ("greaterThan".equals(op)) {
      mOperator = GREATER_THAN;
    } else if ("lessOrEq".equals(op)) {
      mOperator = LESS_OR_EQ;
    } else if ("greaterOrEq".equals(op)) {
      mOperator = GREATER_OR_EQ;
    } else if ("neq".equals(op)) {
      mOperator = NEQ;
    } else if ("abs".equals(op)) {
      mOperator = ABS;
    } else if ("floor".equals(op)) {
      mOperator = FLOOR;
    } else if ("ceil".equals(op)) {
      mOperator = CEIL;
    } else if ("max".equals(op)) {
      mOperator = MAX;
    } else if ("min".equals(op)) {
      mOperator = MIN;
    } else {
      throw new JSApplicationIllegalArgumentException("Unrecognized operator " + op);
    }
  }

  @Override
  protected Object evaluate() {
    for (int i = 0; i < mInputIDs.length; i++) {
      mInputNodes[i] = mNodesManager.findNodeById(mInputIDs[i], Node.class);
    }
    return mOperator.evaluate(mInputNodes);
  }
}

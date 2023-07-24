// @ts-expect-error
import useLinking from "@react-navigation/native/lib/module/useLinking";

export default useLinking as typeof import("./useLinking.native").default;

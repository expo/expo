import { View, Text, Pressable } from "react-native";

import { defaultCSSInterop } from "./web/css-interop";

Object.assign(View, { cssInterop: defaultCSSInterop });
Object.assign(Pressable, { cssInterop: defaultCSSInterop });
Object.assign(Text, { cssInterop: defaultCSSInterop });

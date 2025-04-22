declare module 'react-native/Libraries/NativeModules/specs/NativeSourceCode' {
  namespace SourceCode {
    function getConstants(): { scriptURL: string };
  }
  export default SourceCode;
}

declare module 'react-native/Libraries/Network/FormData' {
  type FormDataValue = string | { name?: string; type?: string; uri: string };

  type Headers = {
    [name: string]: string;
  };

  type FormDataPart =
    | {
        string: string;
        headers: Headers;
      }
    | {
        uri: string;
        headers: Headers;
        name?: string;
        type?: string;
      };

  class FormData {
    append(key: string, value: FormDataValue): void;
    getAll(key: string): FormDataValue[];
    getParts(): FormDataPart[];
  }

  export default FormData;
}

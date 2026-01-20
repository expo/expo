import { GeneratedData, PropData, TypeDefinitionData, TypeDocKind } from './APIDataTypes';
import { getComponentName } from './APISectionUtils';

const componentTypeNames = new Set([
  'React.FC',
  'FC',
  'ForwardRefExoticComponent',
  'React.ForwardRefExoticComponent',
  'ComponentType',
  'React.ComponentType',
  'NamedExoticComponent',
  'React.NamedExoticComponent',
]);

const getComponentPropertyChildren = (entry: GeneratedData): PropData[] => {
  const candidates: PropData[] = [];
  const pushChildren = (children?: PropData[]) => {
    if (children?.length) {
      candidates.push(...children);
    }
  };

  if ('children' in entry) {
    pushChildren(entry.children as PropData[] | undefined);
  }
  pushChildren(entry.type?.declaration?.children);
  entry.type?.types?.forEach(type => {
    pushChildren(type.declaration?.children);
  });

  if (candidates.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  return candidates.filter(child => {
    if (!child || child.kind !== TypeDocKind.Property) {
      return false;
    }
    const id = `${child.name ?? ''}-${child.kind ?? ''}`;
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
};

const getPropsTypeNameFromComponentType = (type?: TypeDefinitionData): string | undefined => {
  if (!type) {
    return undefined;
  }
  if (type.type === 'reference') {
    const typeName = type.name ?? type.target?.qualifiedName;
    if (!typeName || !componentTypeNames.has(typeName)) {
      return undefined;
    }
    const propsType = type.typeArguments?.[0];
    return propsType?.type === 'reference' ? propsType.name : undefined;
  }
  if (type.type === 'intersection' || type.type === 'union') {
    for (const nested of type.types ?? []) {
      const found = getPropsTypeNameFromComponentType(nested);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};

export const buildCompoundNameByComponent = (components: GeneratedData[]) => {
  const componentNameByPropsType = new Map<string, string>();
  const propertiesByEntry = new Map<GeneratedData, PropData[]>();
  const baseNameByEntry = new Map<GeneratedData, string>();

  components.forEach(entry => {
    const baseName = getComponentName(entry.name, entry.children);
    const propsTypeName = getPropsTypeNameFromComponentType(entry.type);
    if (propsTypeName && baseName) {
      componentNameByPropsType.set(propsTypeName, baseName);
    }
    if (baseName) {
      baseNameByEntry.set(entry, baseName);
    }
    propertiesByEntry.set(entry, getComponentPropertyChildren(entry));
  });

  const resolveComponentFromProperty = (prop: PropData) => {
    if (typeof prop.defaultValue === 'string') {
      return prop.defaultValue;
    }
    const propsTypeName = getPropsTypeNameFromComponentType(prop.type);
    if (!propsTypeName) {
      return undefined;
    }
    return componentNameByPropsType.get(propsTypeName);
  };

  const directMap = new Map<string, string>();

  components.forEach(entry => {
    const parentName = baseNameByEntry.get(entry);
    if (!parentName) {
      return;
    }
    const properties = propertiesByEntry.get(entry) ?? [];
    properties.forEach(property => {
      if (!property.name) {
        return;
      }
      const target = resolveComponentFromProperty(property);
      if (!target) {
        return;
      }
      directMap.set(target, `${parentName}.${property.name}`);
    });
  });

  const compoundMap = new Map<string, string>(directMap);

  components.forEach(entry => {
    const parentName = baseNameByEntry.get(entry);
    if (!parentName) {
      return;
    }
    const parentAlias = directMap.get(parentName);
    if (!parentAlias) {
      return;
    }
    const properties = propertiesByEntry.get(entry) ?? [];
    properties.forEach(property => {
      if (!property.name) {
        return;
      }
      const target = resolveComponentFromProperty(property);
      if (!target) {
        return;
      }
      compoundMap.set(target, `${parentAlias}.${property.name}`);
    });
  });

  return compoundMap;
};

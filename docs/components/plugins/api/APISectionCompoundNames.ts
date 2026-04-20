import { GeneratedData, PropData, TypeDefinitionData, TypeDocKind } from './APIDataTypes';
import { getComponentName } from './APISectionUtils';

export const COMPONENT_TYPE_NAMES = new Set([
  'React.FC',
  'FC',
  'ForwardRefExoticComponent',
  'React.ForwardRefExoticComponent',
  'ComponentType',
  'React.ComponentType',
  'NamedExoticComponent',
  'React.NamedExoticComponent',
]);

export const getComponentPropertyChildren = (entry: GeneratedData): PropData[] => {
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
    if (child?.kind !== TypeDocKind.Property) {
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

export const getPropsTypeNameFromComponentType = (
  type?: TypeDefinitionData
): string | undefined => {
  if (!type) {
    return undefined;
  }
  if (type.type === 'reference') {
    const typeName = type.name ?? type.target?.qualifiedName;
    if (!typeName || !COMPONENT_TYPE_NAMES.has(typeName)) {
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

const resolveComponentTargetFromProperty = (
  prop: PropData,
  componentNameByPropsType: Map<string, string>,
  { allowPropsFallback = false }: { allowPropsFallback?: boolean } = {}
): string | undefined => {
  if (typeof prop.defaultValue === 'string') {
    return prop.defaultValue;
  }
  const propsTypeName = getPropsTypeNameFromComponentType(prop.type);
  if (!propsTypeName) {
    return undefined;
  }
  const mapped = componentNameByPropsType.get(propsTypeName);
  if (mapped) {
    return mapped;
  }
  if (allowPropsFallback && propsTypeName.endsWith('Props')) {
    return propsTypeName.replace(/Props$/, '');
  }
  return undefined;
};

const collectComponentMetadata = (components: GeneratedData[]) => {
  const componentNameByPropsType = new Map<string, string>();
  const baseNameByEntry = new Map<GeneratedData, string>();
  const propertiesByEntry = new Map<GeneratedData, PropData[]>();
  const knownNames = new Set<string>();

  const registerComponent = (entry: GeneratedData) => {
    const baseName = getComponentName(entry.name, entry.children);
    if (baseName && baseName !== 'default') {
      knownNames.add(baseName);
      const propsTypeName = getPropsTypeNameFromComponentType(entry.type);
      if (propsTypeName) {
        componentNameByPropsType.set(propsTypeName, baseName);
      }
    }
    if (baseName) {
      baseNameByEntry.set(entry, baseName);
    }
    propertiesByEntry.set(entry, getComponentPropertyChildren(entry));
  };

  components.forEach(registerComponent);

  return {
    componentNameByPropsType,
    baseNameByEntry,
    propertiesByEntry,
    knownNames,
    registerComponent,
  };
};

export const buildCompoundNameByComponent = (components: GeneratedData[]) => {
  const { componentNameByPropsType, propertiesByEntry, baseNameByEntry } =
    collectComponentMetadata(components);

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
      const target = resolveComponentTargetFromProperty(property, componentNameByPropsType);
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
      const target = resolveComponentTargetFromProperty(property, componentNameByPropsType);
      if (!target) {
        return;
      }
      compoundMap.set(target, `${parentAlias}.${property.name}`);
    });
  });

  return compoundMap;
};

const createDerivedComponentEntry = (name: string, prop: PropData): GeneratedData =>
  ({
    name,
    kind: TypeDocKind.Variable,
    comment: prop.comment,
    type: prop.type,
    signatures: prop.signatures,
    getSignature: prop.getSignature,
  }) as GeneratedData;

export const deriveComponentsFromProps = (components: GeneratedData[]) => {
  if (!components?.length) {
    return components;
  }
  const derived: GeneratedData[] = [];
  const { componentNameByPropsType, knownNames, propertiesByEntry, registerComponent } =
    collectComponentMetadata(components);

  const queue = [...components];
  while (queue.length > 0) {
    const entry = queue.shift();
    if (!entry) {
      continue;
    }
    const properties = propertiesByEntry.get(entry) ?? [];
    properties.forEach(property => {
      if (!property.name) {
        return;
      }
      const derivedName = resolveComponentTargetFromProperty(property, componentNameByPropsType, {
        allowPropsFallback: true,
      });
      if (!derivedName || knownNames.has(derivedName)) {
        return;
      }
      if (
        !property.type &&
        !property.signatures &&
        !property.getSignature &&
        typeof property.defaultValue !== 'string'
      ) {
        return;
      }
      const derivedEntry = createDerivedComponentEntry(derivedName, property);
      registerComponent(derivedEntry);
      derived.push(derivedEntry);
      queue.push(derivedEntry);
    });
  }

  return derived.length > 0 ? [...components, ...derived] : components;
};

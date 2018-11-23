/*
 * @author tamarintech / https://tamarintech.com
 * @author evan bacon / somewhere online
 * Description: Early release of an AMF Loader following the pattern of the
 * example loaders in the three.js project.
 *
 * More information about the AMF format: http://amf.wikispaces.com
 *
 * Usage:
 *	var loader = new AMFLoader();
 *	loader.load('/path/to/project.amf', function(objecttree) {
 *		scene.add(objecttree);
 *	});
 *
 * Materials now supported, material colors supported
 * Zip support, requires jszip
 * TextDecoder polyfill required by some browsers (particularly IE, Edge)
 * No constellation support (yet)!
 *
 */

import * as THREE from 'three';
import { TextDecoder } from 'text-encoding';

class AMFLoader {
  manager: THREE.LoadingManager;

  constructor(manager) {
    this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
  }

  load = (url, onLoad, onProgress, onError) => {
    const loader = new THREE.FileLoader(this.manager);
    loader.setResponseType('arraybuffer');
    loader.load(url, text => onLoad(this.parse(text)), onProgress, onError);
  };

  parse = data => {
    function loadDocument(data) {
      let view = new DataView(data);
      const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1));

      if (magic === 'PK') {
        let zip = null;
        const file = null;

        console.log('THREE.AMFLoader: Loading Zip');

        try {
          // @ts-ignore
          zip = new JSZip(data);
        } catch (e) {
          if (e instanceof ReferenceError) {
            console.log('THREE.AMFLoader: jszip missing and file is compressed.');
            return null;
          }
        }

        // @ts-ignore
        for (file in zip.files) {

          // @ts-ignore
          if (file.toLowerCase().substr(-4) === '.amf') {
            break;
          }
        }
        console.log(`THREE.AMFLoader: Trying to load file asset: ${file}`);

        // @ts-ignore
        view = new DataView(zip.file(file).asArrayBuffer());
      }

      const fileText = new TextDecoder('utf-8').decode(view);
      // @ts-ignore
      const xmlData = new DOMParser().parseFromString(fileText, 'application/xml');

      if (xmlData.documentElement.nodeName.toLowerCase() !== 'amf') {
        console.error('THREE.AMFLoader: Error loading AMF - no AMF document found.');
        return null;
      }

      return xmlData;
    }

    function loadDocumentScale(node) {
      let scale = 1.0;
      let unit = 'millimeter';

      if (node.documentElement.attributes.unit !== undefined) {
        unit = node.documentElement.attributes.unit.value.toLowerCase();
      }

      const scaleUnits = {
        millimeter: 1.0,
        inch: 25.4,
        feet: 304.8,
        meter: 1000.0,
        micron: 0.001,
      };

      if (scaleUnits[unit] !== undefined) {
        scale = scaleUnits[unit];
      }

      console.log(`THREE.AMFLoader: Unit scale: ${scale}`);
      return scale;
    }

    function loadMaterials(node) {
      const matName = 'AMF Material';
      const matId = node.getAttribute('id').textContent;
      let color = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

      let loadedMaterial = null;

      for (const i in node.children) {
        const matChildEl = node.children[i];
        if (matChildEl.nodeName === 'metadata' && matChildEl.getAttribute('type') !== undefined) {
          if (matChildEl.getAttribute('type').value === 'name') {
            // @ts-ignore
            matname = matChildEl.textContent;
          }
        } else if (matChildEl.nodeName === 'color') {
          color = loadColor(matChildEl);
        }
      }

      // @ts-ignore
      loadedMaterial = new THREE.MeshPhongMaterial({
        flatShading: true,
        color: new THREE.Color(color.r, color.g, color.b),
        name: matName,
      });

      if (color.a !== 1.0) {
        // @ts-ignore
        loadedMaterial.transparent = true;
        // @ts-ignore
        loadedMaterial.opacity = color.a;
      }

      return { id: matId, material: loadedMaterial };
    }

    function loadColor(node) {
      const color = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

      for (const i in node.children) {
        const matColor = node.children[i];
        if (matColor.nodeName === 'r') {
          color.r = matColor.textContent;
        } else if (matColor.nodeName === 'g') {
          color.g = matColor.textContent;
        } else if (matColor.nodeName === 'b') {
          color.b = matColor.textContent;
        } else if (matColor.nodeName === 'a') {
          color.a = matColor.textContent;
        }
      }

      return color;
    }

    function loadMeshVolume(node) {
      const volume = { name: '', triangles: [], materialid: null };

      if (node.getAttribute('materialid') !== undefined) {
        // @ts-ignore
        volume.materialId = node.getAttribute('materialid').nodeValue;
      }

      for (let i in node.childNodes) {
        const currVolumeNode = node.childNodes[i];
        if (currVolumeNode.nodeName === 'metadata') {
          if (currVolumeNode.getAttribute('type') !== undefined) {
            if (currVolumeNode.getAttribute('type').value === 'name') {
              volume.name = currVolumeNode.textContent;
            }
          }
        } else if (currVolumeNode.nodeName === 'triangle') {
          const v1 = currVolumeNode.getElementsByTagName('v1')[0].textContent;
          const v2 = currVolumeNode.getElementsByTagName('v2')[0].textContent;
          const v3 = currVolumeNode.getElementsByTagName('v3')[0].textContent;

          // @ts-ignore
          volume.triangles.push(v1, v2, v3);
        }
      }

      return volume;
    }

    function loadMeshVertices(node) {
      const vertArray = [];
      const normalArray = [];

      for (let i in node.childNodes) {
        const currVerticesNode = node.childNodes[i];
        if (currVerticesNode.nodeName === 'vertex') {
          for (let i in currVerticesNode.childNodes) {
            const vNode = currVerticesNode.childNodes[i];
            if (vNode.nodeName === 'coordinates') {
              const x = vNode.getElementsByTagName('x')[0].textContent;
              const y = vNode.getElementsByTagName('y')[0].textContent;
              const z = vNode.getElementsByTagName('z')[0].textContent;

              // @ts-ignore
              vertArray.push(x, y, z);
            } else if (vNode.nodeName === 'normal') {
              const nx = vNode.getElementsByTagName('nx')[0].textContent;
              const ny = vNode.getElementsByTagName('ny')[0].textContent;
              const nz = vNode.getElementsByTagName('nz')[0].textContent;

              // @ts-ignore
              normalArray.push(nx, ny, nz);
            }
          }
        }
      }

      return { vertices: vertArray, normals: normalArray };
    }

    function loadObject(node) {
      const objId = node.getAttribute('id');

      const loadedObject = { name: 'amfobject', meshes: [] };
      let currColor = null;

      for (let j = 0; j < node.childNodes.length; j++) {
        let currObjNode = node.childNodes[j];
        if (currObjNode.nodeName === 'metadata') {
          if (currObjNode.getAttribute('type') !== undefined) {
            if (currObjNode.getAttribute('type').value === 'name') {
              loadedObject.name = currObjNode.textContent;
            }
          }
        } else if (currObjNode.nodeName === 'color') {
          // @ts-ignore
          currColor = loadColor(currObjNode);
        } else if (currObjNode.nodeName === 'mesh') {
          const mesh = { vertices: [], normals: [], volumes: [], color: currColor };

          for (let i in currObjNode.childNodes) {
            const currMeshNode = currObjNode.childNodes[i];
            if (currMeshNode.nodeName === 'vertices') {
              const loadedVertices = loadMeshVertices(currMeshNode);

              mesh.normals = mesh.normals.concat(loadedVertices.normals);
              mesh.vertices = mesh.vertices.concat(loadedVertices.vertices);
            } else if (currMeshNode.nodeName === 'volume') {
              // @ts-ignore
              mesh.volumes.push(loadMeshVolume(currMeshNode));
            }
          }

          // @ts-ignore
          loadedObject.meshes.push(mesh);
        }

        // currObjNode = currObjNode.nextElementSibling;
      }

      return { id: objId, obj: loadedObject };
    }

    const xmlData = loadDocument(data);
    let amfName = '';
    let amfAuthor = '';
    const amfScale = loadDocumentScale(xmlData);
    const amfMaterials = {};
    const amfObjects = {};
    const children = xmlData.documentElement.childNodes;

    let i;
    let j;

    for (i = 0; i < children.length; i++) {
      const child = children[i];

      if (child.nodeName === 'metadata') {
        if (child.getAttribute('type') !== undefined) {
          if (child.getAttribute('type').value === 'name') {
            amfName = child.textContent;
          } else if (child.getAttribute('type').value === 'author') {
            amfAuthor = child.textContent;
          }
        }
      } else if (child.nodeName === 'material') {
        const loadedMaterial = loadMaterials(child);

        amfMaterials[loadedMaterial.id] = loadedMaterial.material;
      } else if (child.nodeName === 'object') {
        const loadedObject = loadObject(child);

        amfObjects[loadedObject.id] = loadedObject.obj;
      }
    }

    const sceneObject = new THREE.Group();
    const defaultMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaff, flatShading: true });

    sceneObject.name = amfName;
    sceneObject.userData.author = amfAuthor;
    sceneObject.userData.loader = 'AMF';

    for (const id in amfObjects) {
      const part = amfObjects[id];
      const meshes = part.meshes;
      const newObject = new THREE.Group();
      newObject.name = part.name || '';

      for (i = 0; i < meshes.length; i++) {
        let objDefaultMaterial = defaultMaterial;
        const mesh = meshes[i];
        const vertices = new THREE.Float32BufferAttribute(mesh.vertices, 3);
        let normals = null;

        if (mesh.normals.length) {
          // @ts-ignore
          normals = new THREE.Float32BufferAttribute(mesh.normals, 3);
        }

        if (mesh.color) {
          const color = mesh.color;

          objDefaultMaterial = defaultMaterial.clone();
          objDefaultMaterial.color = new THREE.Color(color.r, color.g, color.b);

          if (color.a !== 1.0) {
            objDefaultMaterial.transparent = true;
            objDefaultMaterial.opacity = color.a;
          }
        }

        const volumes = mesh.volumes;

        for (j = 0; j < volumes.length; j++) {
          const volume = volumes[j];
          const newGeometry = new THREE.BufferGeometry();
          let material = objDefaultMaterial;

          newGeometry.setIndex(volume.triangles);
          newGeometry.addAttribute('position', vertices.clone());

          if (normals) {
            // @ts-ignore
            newGeometry.addAttribute('normal', normals.clone());
          }

          if (amfMaterials[volume.materialId] !== undefined) {
            material = amfMaterials[volume.materialId];
          }

          newGeometry.scale(amfScale, amfScale, amfScale);
          newObject.add(new THREE.Mesh(newGeometry, material.clone()));
        }
      }

      sceneObject.add(newObject);
    }

    return sceneObject;
  };
}

// @ts-ignore
THREE.AMFLoader = AMFLoader;

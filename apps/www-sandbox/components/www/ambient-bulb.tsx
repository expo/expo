'use dom';

// https://codepen.io/lila1984/pen/zYBLVKb

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CustomThreeJSComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, camera, and renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      95,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xe2ded2, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Geometry and material
    const geometry = new THREE.SphereGeometry(6, 64, 64);

    const uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib['ambient'],
      THREE.UniformsLib['lights'],
      THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms),
      {
        diffuse: { type: 'c', value: new THREE.Color(0xff00ff) },
        dirSpecularWeight: { type: 'v3', value: new THREE.Vector3(1, 9, 1) },
        time: { type: 'f', value: 0.0 },
      },
    ]);

    const vertexShader = `
      uniform float time;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vec2 p = uv * vec2(3.141592653589793 * 2.0);
        float maxOffLen = 0.4;
        vec3 offset = normalize(normal) * vec3(sin(time * 4.0 + p.y ) * maxOffLen - maxOffLen);
        vUv = uv;
        vNormal = normalize(normal);
        vec3 transformed = vec3(position + offset);
        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform vec3 diffuse;
      uniform float opacity;
      uniform vec3 ambient;
      uniform vec3 emissive;
      uniform vec3 specular;
      uniform float shininess;
      varying vec2 vUv;
      varying vec3 vViewPosition;
      varying vec3 vNormal;
      
      vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
      
      float cnoise(vec3 P) {
        vec3 Pi0 = floor(P); 
        vec3 Pi1 = Pi0 + vec3(1.0); 
        Pi0 = mod(Pi0, 289.0);
        Pi1 = mod(Pi1, 289.0);
        vec3 Pf0 = fract(P); 
        vec3 Pf1 = Pf0 - vec3(1.0); 
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;
        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);
        vec4 gx0 = ixy0 / 7.0;
        vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);
        vec4 gx1 = ixy1 / 7.0;
        vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);
        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;
        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);
        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
      }
      
      void main() {
        vec3 color = vec3(1.0);
        float r = abs(sin( (vUv.x + time * 0.125 ) * 4.0 )) * 0.2 + 0.7;
        float g = abs(sin( (vUv.y + time * 0.245 ) * 2.0 )) * 0.2 + 0.7;
        float b = abs(sin( (vUv.y - time * 0.333 ) * 2.0 )) * 0.2 + 0.7;
        r += cnoise(vec3(vUv.x*4.0,vUv.y*4.0, time)) * 0.1;
        g += cnoise(vec3(vUv.x*8.0,vUv.y*5.0, time*2.0)) * 0.1;
        b += cnoise(vec3(vUv.x*12.0,vUv.y*6.0, time*3.0)) * 0.1;
        color = vec3(r,g,b);
        vec4 diffuseColor = vec4(color, opacity);
        gl_FragColor = vec4(diffuseColor.rgb, diffuseColor.a);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      lights: true,
    });

    material.uniforms.shininess.value = 34.0;

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    hemiLight.color.setHSL(0.6, 1, 0.8);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.45);
    dirLight.color.setHSL(0.1, 1.0, 0.8);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(30);
    scene.add(dirLight);

    camera.position.z = 10;

    const animate = (timestamp: number = 0) => {
      const t = timestamp * 0.001;
      material.uniforms.time.value = t;
      sphere.rotation.z = -t * 0.02 - 0.2;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} />;
};

export default CustomThreeJSComponent;

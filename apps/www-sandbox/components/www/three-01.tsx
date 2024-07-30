'use dom';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeThing({}: { dom?: import('expo/dom').DOMProps }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    renderer.setSize(ref.current.clientWidth, ref.current.clientHeight);
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0.0);
    ref.current!.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      ref.current.clientWidth / ref.current.clientHeight,
      1,
      1000
    );
    camera.position.z = 400;
    scene.add(camera);

    const circle = new THREE.Object3D();
    const skelet = new THREE.Object3D();
    const particle = new THREE.Object3D();

    scene.add(circle);
    scene.add(skelet);
    scene.add(particle);

    const geometry = new THREE.TetrahedronGeometry(2, 0);
    const geom = new THREE.IcosahedronGeometry(7, 1);
    const geom2 = new THREE.IcosahedronGeometry(15, 1);

    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      flatShading: true,
    });

    for (let i = 0; i < 1000; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      mesh.position.multiplyScalar(90 + Math.random() * 700);
      mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      particle.add(mesh);
    }

    const mat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      flatShading: true,
    });

    const mat2 = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      wireframe: true,
      side: THREE.DoubleSide,
    });

    const planet = new THREE.Mesh(geom, mat);
    planet.scale.x = planet.scale.y = planet.scale.z = 16;
    circle.add(planet);

    const planet2 = new THREE.Mesh(geom2, mat2);
    planet2.scale.x = planet2.scale.y = planet2.scale.z = 10;
    skelet.add(planet2);

    const ambientLight = new THREE.AmbientLight(0x999999);
    scene.add(ambientLight);

    const lights = [];
    lights[0] = new THREE.DirectionalLight(0xffffff, 1);
    lights[0].position.set(1, 0, 0);
    lights[1] = new THREE.DirectionalLight(0x11e8bb, 1);
    lights[1].position.set(0.75, 1, 0.5);
    lights[2] = new THREE.DirectionalLight(0x8200c9, 1);
    lights[2].position.set(-0.75, -1, 0.5);
    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
      camera.aspect = ref.current.clientWidth / ref.current.clientHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(ref.current.clientWidth, ref.current.clientHeight);
    }

    function animate() {
      requestAnimationFrame(animate);

      particle.rotation.x += 0.0;
      particle.rotation.y -= 0.004;
      circle.rotation.x -= 0.002;
      circle.rotation.y -= 0.003;
      skelet.rotation.x -= 0.001;
      skelet.rotation.y += 0.002;
      renderer.clear();

      renderer.render(scene, camera);
    }

    animate();
  }, []);

  return (
    <div className="items-center flex flex-1">
      <div
        ref={ref}
        style={{
          flex: 1,
          height: 156,
          aspectRatio: '1 / 1',
          // background: 'linear-gradient(to bottom,  #11e8bb 0%,#8200c9 100%)',
        }}
        id="canvas"
      />
    </div>
  );
}

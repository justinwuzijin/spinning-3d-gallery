import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SimpleThreeTest: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('Starting simple Three.js test...');
    console.log('Three.js version:', THREE.REVISION);
    console.log('WebGL support:', !!window.WebGLRenderingContext);

    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      // Create camera
      const camera = new THREE.PerspectiveCamera(75, 384 / 256, 0.1, 1000);
      camera.position.z = 5;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(384, 256);
      mountRef.current.appendChild(renderer.domElement);

      // Create a simple cube
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      // Add some light
      const light = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(light);

      // Animation
      function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
      }

      animate();

      console.log('Simple Three.js test successful!');

      // Cleanup
      return () => {
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };

    } catch (error) {
      console.error('Simple Three.js test failed:', error);
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div ref={mountRef} className="border border-white rounded-lg overflow-hidden" />
      <p className="mt-4 text-sm text-gray-400">If you see a rotating green cube, Three.js is working!</p>
    </div>
  );
};

export default SimpleThreeTest; 
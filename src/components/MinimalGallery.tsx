import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const MinimalGallery: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('=== MINIMAL GALLERY TEST ===');
    console.log('Mount ref available:', !!mountRef.current);
    console.log('Three.js version:', THREE.REVISION);
    console.log('WebGL support:', !!window.WebGLRenderingContext);

    try {
      // 1. Create scene
      console.log('1. Creating scene...');
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      console.log('✓ Scene created');

      // 2. Create camera
      console.log('2. Creating camera...');
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;
      console.log('✓ Camera created');

      // 3. Create renderer
      console.log('3. Creating renderer...');
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      console.log('✓ Renderer created');

      // 4. Add renderer to DOM
      console.log('4. Adding renderer to DOM...');
      mountRef.current.appendChild(renderer.domElement);
      console.log('✓ Renderer added to DOM');

      // 5. Create a simple cube
      console.log('5. Creating cube...');
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      console.log('✓ Cube created and added to scene');

      // 6. Add light
      console.log('6. Adding light...');
      const light = new THREE.AmbientLight(0xffffff, 1);
      scene.add(light);
      console.log('✓ Light added');

      // 7. Start animation
      console.log('7. Starting animation...');
      function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
      }
      animate();
      console.log('✓ Animation started');

      console.log('=== MINIMAL GALLERY SUCCESS ===');

      // Cleanup
      return () => {
        console.log('Cleaning up minimal gallery...');
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };

    } catch (error) {
      console.error('=== MINIMAL GALLERY ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    }
  }, []);

  return (
    <div className="w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 p-4 rounded">
        <h3 className="font-bold">Minimal Gallery Test</h3>
        <p>Check console for logs</p>
        <p>You should see a rotating green cube</p>
      </div>
    </div>
  );
};

export default MinimalGallery; 
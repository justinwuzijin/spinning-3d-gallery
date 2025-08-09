import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface MediaItem {
  id: string;
  type: 'video' | 'image';
  src: string;
  title: string;
  prompt?: string;
}

interface SimpleGalleryProps {
  mediaItems: MediaItem[];
}

const SimpleGallery: React.FC<SimpleGalleryProps> = ({ mediaItems }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const groupRef = useRef<THREE.Group>();
  const frameId = useRef<number>();

  useEffect(() => {
    console.log('SimpleGallery mounted with:', { mediaItems: mediaItems?.length });
    
    if (!mountRef.current) {
      console.error('Mount ref not available');
      return;
    }

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 20);
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current = renderer;

      mountRef.current.appendChild(renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Create group for all media items
      const group = new THREE.Group();
      groupRef.current = group;
      scene.add(group);

      // Create simple colored cubes for each media item
      mediaItems.forEach((item, index) => {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ 
          color: new THREE.Color().setHSL(index / mediaItems.length, 0.8, 0.5)
        });
        const cube = new THREE.Mesh(geometry, material);
        
        // Position in a circle
        const angle = (index / mediaItems.length) * Math.PI * 2;
        const radius = 8;
        cube.position.x = Math.cos(angle) * radius;
        cube.position.z = Math.sin(angle) * radius;
        
        cube.userData = { item };
        group.add(cube);
      });

      // Animation loop
      const animate = () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !groupRef.current) {
          return;
        }

        // Rotate the group
        groupRef.current.rotation.y += 0.01;

        rendererRef.current.render(sceneRef.current, cameraRef.current);
        frameId.current = requestAnimationFrame(animate);
      };

      animate();

      // Handle resize
      const handleResize = () => {
        if (!cameraRef.current || !rendererRef.current) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (frameId.current) {
          cancelAnimationFrame(frameId.current);
        }
        if (rendererRef.current && mountRef.current) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      };
    } catch (error) {
      console.error('Error initializing SimpleGallery:', error);
    }
  }, [mediaItems]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="w-full h-full absolute inset-0 z-0" />
      
      {/* Overlay text */}
      <div className="absolute top-1/2 left-8 transform -translate-y-1/2 text-white text-left z-10">
        <h1 className="text-5xl mb-6 font-black tracking-tight drop-shadow-2xl">
          Simple Gallery Test
        </h1>
        <p className="text-sm opacity-95 tracking-wide drop-shadow-lg">
          {mediaItems?.length || 0} items loaded
        </p>
      </div>
    </div>
  );
};

export default SimpleGallery; 
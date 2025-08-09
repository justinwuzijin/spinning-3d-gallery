import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface MediaItem {
  id: string;
  type: 'video' | 'image';
  src: string;
  thumbnail?: string;
  title: string;
}

interface Gallery3DProps {
  mediaItems: MediaItem[];
  radius?: number;
}

const Gallery3D: React.FC<Gallery3DProps> = ({ mediaItems, radius = 8 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const groupRef = useRef<THREE.Group>();
  const frameId = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  const createVideoTexture = (item: MediaItem): THREE.Texture => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.src = item.src;
    
    videosRef.current.set(item.id, video);
    
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;
    
    return texture;
  };

  const createImageTexture = (src: string): Promise<THREE.Texture> => {
    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.load(src, (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        resolve(texture);
      });
    });
  };

  const createSpherePoints = (count: number, radius: number) => {
    const points: THREE.Vector3[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      
      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = Math.sin(phi) * Math.sin(theta) * radius;
      const z = Math.cos(phi) * radius;
      
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return points;
  };

  const initScene = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 15;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create group for all media items
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    // Add subtle particles for atmosphere
    createParticles(scene);
  };

  const createParticles = (scene: THREE.Scene) => {
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.1,
      transparent: true,
      opacity: 0.6
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
  };

  const createMediaItems = async () => {
    if (!groupRef.current) return;

    const positions = createSpherePoints(mediaItems.length, radius);
    const loadPromises: Promise<void>[] = [];

    mediaItems.forEach((item, index) => {
      const promise = (async () => {
        try {
          let texture: THREE.Texture;
          
          if (item.type === 'video') {
            texture = createVideoTexture(item);
          } else {
            texture = await createImageTexture(item.src);
          }

          // Create plane geometry for media display
          const geometry = new THREE.PlaneGeometry(2, 1.5);
          const material = new THREE.MeshLambertMaterial({ 
            map: texture,
            transparent: true
          });

          const mesh = new THREE.Mesh(geometry, material);
          const position = positions[index];
          
          mesh.position.copy(position);
          mesh.lookAt(0, 0, 0);
          mesh.userData = { item, originalScale: { x: 1, y: 1, z: 1 } };

          // Add subtle glow effect
          const glowGeometry = new THREE.PlaneGeometry(2.2, 1.7);
          const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.1
          });
          const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
          glowMesh.position.copy(position);
          glowMesh.lookAt(0, 0, 0);
          glowMesh.position.multiplyScalar(0.99); // Slightly behind main mesh

          groupRef.current!.add(glowMesh);
          groupRef.current!.add(mesh);
          meshesRef.current.set(item.id, mesh);

        } catch (error) {
          console.error(`Error loading media item ${item.id}:`, error);
        }
      })();

      loadPromises.push(promise);
    });

    await Promise.all(loadPromises);
    setIsLoading(false);
  };

  const handleMouseMove = (event: MouseEvent) => {
    mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

    targetRotationRef.current.y = mouseRef.current.x * 0.5;
    targetRotationRef.current.x = mouseRef.current.y * 0.5;
  };

  const handleClick = (event: MouseEvent) => {
    if (!cameraRef.current || !groupRef.current) return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const meshes = Array.from(meshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const item = clickedMesh.userData.item as MediaItem;

      if (item.type === 'video') {
        const video = videosRef.current.get(item.id);
        if (video) {
          if (activeVideo === item.id) {
            video.pause();
            setActiveVideo(null);
          } else {
            // Pause all other videos
            videosRef.current.forEach((v, id) => {
              if (id !== item.id) v.pause();
            });
            
            video.play();
            setActiveVideo(item.id);
          }
        }
      }
    }
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !groupRef.current) {
      return;
    }

    // Smooth rotation interpolation
    currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.05;
    currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.05;

    groupRef.current.rotation.x = currentRotationRef.current.x;
    groupRef.current.rotation.y = currentRotationRef.current.y;

    // Auto-rotation when not interacting
    const timeDiff = Date.now() * 0.0005;
    if (Math.abs(mouseRef.current.x) < 0.1 && Math.abs(mouseRef.current.y) < 0.1) {
      groupRef.current.rotation.y += 0.002;
    }

    // Animate active video scaling
    meshesRef.current.forEach((mesh, id) => {
      const isActive = activeVideo === id;
      const targetScale = isActive ? 1.2 : 1;
      const currentScale = mesh.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.1;
      mesh.scale.set(newScale, newScale, newScale);
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    frameId.current = requestAnimationFrame(animate);
  };

  const handleResize = () => {
    if (!cameraRef.current || !rendererRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  useEffect(() => {
    initScene();
    createMediaItems();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }

      // Clean up videos
      videosRef.current.forEach(video => {
        video.pause();
        video.src = '';
      });
    };
  }, [mediaItems]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={mountRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-white text-xl font-light">Loading Gallery...</div>
        </div>
      )}
      
      <div className="absolute top-4 left-4 text-white">
        <h1 className="text-2xl font-light mb-2">Interactive 3D Gallery</h1>
        <p className="text-sm opacity-70">Mouse to rotate • Click videos to play/pause</p>
      </div>

      <div className="absolute bottom-4 right-4 text-white text-sm opacity-70">
        {activeVideo && 'Playing video...'}
      </div>
    </div>
  );
};

export default Gallery3D;
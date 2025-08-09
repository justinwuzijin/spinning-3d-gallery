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

const Gallery3D: React.FC<Gallery3DProps> = ({ mediaItems, radius = 12 }) => {
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
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

    // Scene setup - 使用更柔和的背景色
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa); // 极简的白色背景
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60, // 更宽的视角
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 20;
    cameraRef.current = camera;

    // Renderer setup - 更柔和的渲染
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false; // 移除阴影以获得更简洁的外观
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 更柔和的照明
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create group for all media items
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);
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

          // 更简洁的平面几何体
          const geometry = new THREE.PlaneGeometry(3, 2);
          const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9
          });

          const mesh = new THREE.Mesh(geometry, material);
          const position = positions[index];
          
          mesh.position.copy(position);
          mesh.lookAt(0, 0, 0);
          mesh.userData = { 
            item, 
            originalScale: { x: 1, y: 1, z: 1 },
            originalOpacity: 0.9
          };

          // 添加极简的边框效果
          const borderGeometry = new THREE.PlaneGeometry(3.1, 2.1);
          const borderMaterial = new THREE.MeshBasicMaterial({
            color: 0xe0e0e0,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
          });
          const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
          borderMesh.position.copy(position);
          borderMesh.lookAt(0, 0, 0);
          borderMesh.position.multiplyScalar(0.99);

          groupRef.current!.add(borderMesh);
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

    targetRotationRef.current.y = mouseRef.current.x * 0.3; // 更温和的旋转
    targetRotationRef.current.x = mouseRef.current.y * 0.3;

    // 检测悬停的项目
    if (!cameraRef.current || !groupRef.current) return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const meshes = Array.from(meshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hoveredMesh = intersects[0].object as THREE.Mesh;
      const item = hoveredMesh.userData.item as MediaItem;
      setHoveredItem(item.id);
    } else {
      setHoveredItem(null);
    }
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

    // 更平滑的旋转插值
    currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.03;
    currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.03;

    groupRef.current.rotation.x = currentRotationRef.current.x;
    groupRef.current.rotation.y = currentRotationRef.current.y;

    // 更缓慢的自动旋转
    const timeDiff = Date.now() * 0.0002;
    if (Math.abs(mouseRef.current.x) < 0.05 && Math.abs(mouseRef.current.y) < 0.05) {
      groupRef.current.rotation.y += 0.001;
    }

    // 更优雅的悬停和激活动画
    meshesRef.current.forEach((mesh, id) => {
      const isActive = activeVideo === id;
      const isHovered = hoveredItem === id;
      
      let targetScale = 1;
      let targetOpacity = 0.9;
      
      if (isActive) {
        targetScale = 1.1;
        targetOpacity = 1;
      } else if (isHovered) {
        targetScale = 1.05;
        targetOpacity = 0.95;
      }
      
      const currentScale = mesh.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.08;
      mesh.scale.set(newScale, newScale, newScale);
      
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = material.opacity + (targetOpacity - material.opacity) * 0.08;
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
    <div className="relative w-full h-screen overflow-hidden bg-[#fafafa]">
      <div ref={mountRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#fafafa] bg-opacity-95">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <div className="text-gray-500 text-sm font-light tracking-wide">loading gallery...</div>
          </div>
        </div>
      )}
      
      <div className="absolute top-8 left-8 text-gray-800">
        <h1 className="text-4xl font-light mb-3 tracking-wide">gallery</h1>
        <p className="text-sm text-gray-500 font-light tracking-wide">hover to explore • click to play</p>
      </div>

      {activeVideo && (
        <div className="absolute bottom-8 right-8 text-gray-600 text-sm font-light">
          playing video...
        </div>
      )}
    </div>
  );
};

export default Gallery3D;
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
  const [isExhibitionMode, setIsExhibitionMode] = useState(false);
  const [exhibitionVideo, setExhibitionVideo] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [focusedItem, setFocusedItem] = useState<MediaItem | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const autoRotateRef = useRef(true);
  const focusTimerRef = useRef<number | null>(null);

  const createVideoTexture = (item: MediaItem): Promise<THREE.Texture> => {
    return new Promise((resolve) => {
      console.log('Creating video texture for:', item.src);
      
      // Create fallback texture function
      const createFallbackTexture = (title: string, id?: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Create a gradient background
          const gradient = ctx.createLinearGradient(0, 0, 320, 240);
          gradient.addColorStop(0, '#ff0000');
          gradient.addColorStop(1, '#cc0000');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 320, 240);
          
          // Add text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(title, 160, 100);
          if (id) {
            ctx.font = '12px Arial';
            ctx.fillText(id, 160, 120);
          }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;
        return texture;
      };
      
      // Handle YouTube URLs - convert to embed format
      if (item.src.includes('youtube.com') || item.src.includes('youtu.be')) {
        const videoId = extractYouTubeId(item.src);
        console.log('Extracted video ID:', videoId);
        
        if (videoId) {
          // Try to load actual YouTube thumbnail first
          const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          console.log('Loading thumbnail from:', thumbnailUrl);
          
          const textureLoader = new THREE.TextureLoader();
          
          // Set a timeout for thumbnail loading
          const timeout = setTimeout(() => {
            console.log('Thumbnail loading timeout, creating fallback');
            const fallbackTexture = createFallbackTexture('YouTube Video', videoId);
            resolve(fallbackTexture);
          }, 5000); // 5 second timeout
          
          textureLoader.load(
            thumbnailUrl,
            (texture) => {
              clearTimeout(timeout);
              console.log('Successfully loaded thumbnail for:', videoId);
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.format = THREE.RGBFormat;
              resolve(texture);
            },
            undefined, // onProgress
            () => {
              // onError - create fallback
              clearTimeout(timeout);
              console.log('Failed to load thumbnail for:', videoId, 'creating fallback');
              const fallbackTexture = createFallbackTexture('YouTube Video', videoId);
              resolve(fallbackTexture);
            }
          );
        } else {
          console.log('Invalid YouTube URL, creating fallback');
          const fallbackTexture = createFallbackTexture('Invalid YouTube URL');
          resolve(fallbackTexture);
        }
      } else {
        // Handle direct video files
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
        resolve(texture);
      }
    });
  };

  const extractYouTubeId = (url: string): string | null => {
    console.log('Extracting YouTube ID from:', url);
    
    let videoId = null;
    
    try {
      if (url.includes('youtu.be/')) {
        // Handle youtu.be URLs like: https://youtu.be/p7cLUjnm218?si=r4Uh9xTiBaQY_PHV
        const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        videoId = match ? match[1] : null;
        console.log('Extracted YouTube ID from youtu.be:', videoId);
      } else if (url.includes('youtube.com/watch')) {
        // Handle youtube.com URLs like: https://www.youtube.com/watch?v=p7cLUjnm218&si=r4Uh9xTiBaQY_PHV
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
        console.log('Extracted YouTube ID from youtube.com:', videoId);
      }
      
      const result = videoId && videoId.length === 11 ? videoId : null;
      console.log('Final YouTube ID:', result);
      return result;
    } catch (error) {
      console.error('Error extracting YouTube ID:', error);
      return null;
    }
  };

  const createImageTexture = (src: string): Promise<THREE.Texture> => {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      
      // Set a timeout for image loading
      const timeout = setTimeout(() => {
        console.log('Image loading timeout, creating fallback');
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Create a more visually appealing gradient background
          const gradient = ctx.createLinearGradient(0, 0, 320, 240);
          gradient.addColorStop(0, '#1a1a1a');
          gradient.addColorStop(0.5, '#2d1b1b');
          gradient.addColorStop(1, '#1b1b2d');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 320, 240);
          
          // Add some geometric shapes for visual interest
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.moveTo(50, 50);
          ctx.lineTo(270, 50);
          ctx.lineTo(270, 190);
          ctx.lineTo(50, 190);
          ctx.closePath();
          ctx.fill();
          
          // Add text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Gallery Item', 160, 120);
          ctx.font = '12px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillText('Click to view', 160, 140);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        resolve(texture);
      }, 5000); // 5 second timeout
      
      loader.load(
        src,
        (texture) => {
          clearTimeout(timeout);
          console.log('Successfully loaded image:', src);
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          resolve(texture);
        },
        undefined, // onProgress
        (error) => {
          // onError - create fallback
          clearTimeout(timeout);
          console.log('Failed to load image:', src, 'creating fallback');
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Create a more visually appealing gradient background
            const gradient = ctx.createLinearGradient(0, 0, 320, 240);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(0.5, '#2d1b1b');
            gradient.addColorStop(1, '#1b1b2d');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 320, 240);
            
            // Add some geometric shapes for visual interest
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.moveTo(50, 50);
            ctx.lineTo(270, 50);
            ctx.lineTo(270, 190);
            ctx.lineTo(50, 190);
            ctx.closePath();
            ctx.fill();
            
            // Add text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Gallery Item', 160, 120);
            ctx.font = '12px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('Click to view', 160, 140);
          }
          const texture = new THREE.CanvasTexture(canvas);
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          resolve(texture);
        }
      );
    });
  };

  const createCircularStructure = (count: number, radius: number) => {
    const points: THREE.Vector3[] = [];
    
    // Create a compact circular 3D structure - ball-like formation with images facing outwards
    // For 32 items, we'll create multiple rings for better distribution
    
    // Calculate how many rings we need - adjusted for compact ball formation
    const itemsPerRing = 8; // 8 items per ring
    const numRings = Math.ceil(count / itemsPerRing);
    
    for (let i = 0; i < count; i++) {
      const ringIndex = Math.floor(i / itemsPerRing);
      const itemInRing = i % itemsPerRing;
      
      // Calculate ring radius - much tighter spacing for compact ball
      const ringRadius = radius * (0.2 + ringIndex * 0.15);
      
      // Calculate angle for this item in the ring
      const angle = (itemInRing / itemsPerRing) * Math.PI * 2;
      
      // Calculate position on the circle
      const x = Math.cos(angle) * ringRadius;
      const y = Math.sin(angle) * ringRadius;
      
      // Add some depth variation for 3D effect - reduced for compact ball
      const z = Math.sin(ringIndex * 0.3) * Math.cos(angle * 1.5) * (radius * 0.05);
      
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return points;
  };

  const createFloatingParticles = (scene: THREE.Scene) => {
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x000000,
      size: 0.05,
      transparent: true,
      opacity: 0.3
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
  };

  const initScene = () => {
    if (!mountRef.current) return;

    // Scene setup - Bright vibrant background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa); // Bright background to match the vibe
    sceneRef.current = scene;

    // Camera setup - Adjusted for compact circular structure
    const camera = new THREE.PerspectiveCamera(
      60, // Wider FOV for better view of circular structure
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Position camera to accommodate compact circular structure
    camera.position.set(0, 0, 15);
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

    // Brighter lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create group for all media items
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    // Add subtle floating particles for atmosphere
    createFloatingParticles(scene);
  };

  const createMediaItems = async () => {
    if (!groupRef.current) {
      setIsLoading(false);
      return;
    }

    // If no media items, just set loading to false
    if (!mediaItems || mediaItems.length === 0) {
      console.log('No media items to load');
      setIsLoading(false);
      return;
    }

    try {
      const positions = createCircularStructure(mediaItems.length, radius);
      const loadPromises: Promise<void>[] = [];

      mediaItems.forEach((item, index) => {
        const promise = (async () => {
          try {
            let texture: THREE.Texture;
            
            if (item.type === 'video') {
              texture = await createVideoTexture(item);
            } else {
              texture = await createImageTexture(item.src);
            }

            // Create plane geometry - smaller for compact ball formation
            const geometry = new THREE.PlaneGeometry(2, 1.5);
            const material = new THREE.MeshBasicMaterial({ 
              map: texture,
              transparent: true,
              opacity: 0.9
            });

            const mesh = new THREE.Mesh(geometry, material);
            const position = positions[index];
            
            mesh.position.copy(position);
            // Make each item face towards the screen (outwards) like in the referenced article
            mesh.lookAt(0, 0, 15); // Look towards the camera position
            mesh.userData = { 
              item, 
              originalScale: { x: 1, y: 1, z: 1 },
              originalOpacity: 0.9,
              originalPosition: position.clone()
            };

            // Add border effects - smaller for compact formation
            const borderGeometry = new THREE.PlaneGeometry(2.2, 1.7);
            const borderMaterial = new THREE.MeshBasicMaterial({
              color: 0x000000,
              transparent: true,
              opacity: 0.1,
              side: THREE.DoubleSide
            });
            const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
            borderMesh.position.copy(position);
            borderMesh.lookAt(0, 0, 15); // Look towards the camera position
            borderMesh.position.multiplyScalar(0.98);

            // Add inner border effects - smaller for compact formation
            const innerBorderGeometry = new THREE.PlaneGeometry(1.9, 1.4);
            const innerBorderMaterial = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.2,
              side: THREE.DoubleSide
            });
            const innerBorderMesh = new THREE.Mesh(innerBorderGeometry, innerBorderMaterial);
            innerBorderMesh.position.copy(position);
            innerBorderMesh.lookAt(0, 0, 15); // Look towards the camera position
            innerBorderMesh.position.multiplyScalar(1.01);

            groupRef.current!.add(borderMesh);
            groupRef.current!.add(innerBorderMesh);
            groupRef.current!.add(mesh);
            meshesRef.current.set(item.id, mesh);

          } catch (error) {
            console.error(`Error loading media item ${item.id}:`, error);
            // Create a fallback mesh even if loading fails - smaller for compact formation
            const fallbackGeometry = new THREE.PlaneGeometry(2, 1.5);
            const fallbackMaterial = new THREE.MeshBasicMaterial({
              color: 0xff0000,
              transparent: true,
              opacity: 0.9
            });
            const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
            const position = positions[index];
            fallbackMesh.position.copy(position);
            fallbackMesh.lookAt(0, 0, 15); // Look towards the camera position
            groupRef.current!.add(fallbackMesh);
            meshesRef.current.set(item.id, fallbackMesh);
          }
        })();

        loadPromises.push(promise);
      });

      await Promise.all(loadPromises);
      console.log('All media items loaded successfully');
    } catch (error) {
      console.error('Error in createMediaItems:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startExhibitionMode = () => {
    if (!isExhibitionMode) return;
    
    const showNextVideo = () => {
      // Randomly select a video
      const randomIndex = Math.floor(Math.random() * mediaItems.length);
      const selectedVideo = mediaItems[randomIndex];
      
      setExhibitionVideo(selectedVideo.id);
      
      // Play the video if it's a direct video file
      if (selectedVideo.type === 'video' && !selectedVideo.src.includes('youtube.com')) {
        const video = videosRef.current.get(selectedVideo.id);
        if (video) {
          video.play();
        }
      }
      
      // Schedule next video
      focusTimerRef.current = window.setTimeout(showNextVideo, 10000); // 10 seconds per video
    };
    
    // Start the cycle
    showNextVideo();
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isExhibitionMode) return; // Disable mouse control in exhibition mode
    
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
    if (isFocused) {
      // If already focused, return to gallery view
      setIsFocused(false);
      setFocusedItem(null);
      setActiveVideo(null);
      return;
    }

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current!);

    if (groupRef.current) {
      const intersects = raycaster.intersectObjects(groupRef.current.children, true);
      
      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const mesh = meshesRef.current.get(intersectedObject.uuid) || intersectedObject;
        
        // Find the media item associated with this mesh
        let clickedItem: MediaItem | null = null;
        for (const [id, meshRef] of meshesRef.current.entries()) {
          if (meshRef === mesh || meshRef.uuid === intersectedObject.uuid) {
            clickedItem = mediaItems.find(item => item.id === id) || null;
            break;
          }
        }

        if (clickedItem) {
          // Focus on the clicked item
          setIsFocused(true);
          setFocusedItem(clickedItem);
          setActiveVideo(clickedItem.id);
          
          // If it's a YouTube video, open it in a new tab
          if (clickedItem.type === 'video' && (clickedItem.src.includes('youtube.com') || clickedItem.src.includes('youtu.be'))) {
            window.open(clickedItem.src, '_blank');
          }
        }
      }
    }
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !groupRef.current) {
      return;
    }

    if (isFocused && focusedItem) {
      // Focused mode: center the focused item
      const focusedMesh = meshesRef.current.get(focusedItem.id);
      if (focusedMesh) {
        // Animate camera to focus on the selected item
        const targetPosition = focusedMesh.position.clone();
        const currentPosition = cameraRef.current.position;
        
        // Move camera closer to the focused item
        const distance = 8;
        const direction = new THREE.Vector3(0, 0, 1);
        const targetCameraPosition = targetPosition.clone().add(direction.multiplyScalar(distance));
        
        currentPosition.lerp(targetCameraPosition, 0.05);
        cameraRef.current.lookAt(targetPosition);
        
        // Scale up the focused item
        const targetScale = 2;
        const currentScale = focusedMesh.scale.x;
        const newScale = currentScale + (targetScale - currentScale) * 0.1;
        focusedMesh.scale.setScalar(newScale);
        
        // Hide other items
        meshesRef.current.forEach((mesh, id) => {
          if (id !== focusedItem.id) {
            const currentOpacity = (mesh.material as THREE.MeshBasicMaterial).opacity || 0.9;
            const newOpacity = currentOpacity + (0 - currentOpacity) * 0.1;
            (mesh.material as THREE.MeshBasicMaterial).opacity = newOpacity;
          }
        });
      }
    } else {
      // Normal gallery mode
      // Auto-rotation for exhibition mode
      if (isExhibitionMode && autoRotateRef.current) {
        groupRef.current.rotation.y += 0.005; // Slow, cinematic rotation
      } else {
        // Manual rotation when not in exhibition mode
        currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.03;
        currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.03;

        groupRef.current.rotation.x = currentRotationRef.current.x;
        groupRef.current.rotation.y = currentRotationRef.current.y;

        // 更缓慢的自动旋转
        if (Math.abs(mouseRef.current.x) < 0.05 && Math.abs(mouseRef.current.y) < 0.05) {
          groupRef.current.rotation.y += 0.001;
        }
      }

      // Exhibition mode: show only one video, interactive mode: show all videos
      meshesRef.current.forEach((mesh, id) => {
        const isActive = activeVideo === id;
        const isHovered = hoveredItem === id;
        const isExhibitionActive = exhibitionVideo === id;
        
        let targetScale = 1;
        let targetOpacity = 0.9;
        
        if (isExhibitionMode) {
          // Exhibition mode: only show the current exhibition video
          if (isExhibitionActive) {
            targetScale = 1.5;
            targetOpacity = 1;
          } else {
            targetScale = 0;
            targetOpacity = 0;
          }
        } else {
          // Interactive mode: normal behavior
          if (isActive) {
            targetScale = 1.1;
            targetOpacity = 1;
          } else if (isHovered) {
            targetScale = 1.05;
            targetOpacity = 0.95;
          }
        }
        
        const currentScale = mesh.scale.x;
        const newScale = currentScale + (targetScale - currentScale) * 0.08;
        mesh.scale.setScalar(newScale);
        
        const currentOpacity = (mesh.material as THREE.MeshBasicMaterial).opacity || 0.9;
        const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.08;
        (mesh.material as THREE.MeshBasicMaterial).opacity = newOpacity;
      });
    }

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
    const initializeGallery = async () => {
      initScene();
      await createMediaItems();
    };

    initializeGallery();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    animate();

    // Start exhibition mode cycle
    if (isExhibitionMode) {
      setTimeout(startExhibitionMode, 2000); // Start after 2 seconds
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
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
  }, [mediaItems, isExhibitionMode]);

      return (
        <div className="relative w-full h-screen overflow-hidden">
          {/* Glitch background effect */}
          <div className="glitch-bg"></div>
          
          <div ref={mountRef} className="w-full h-full" />
          
          {/* 90s Television Effects */}
          <div className="crt-overlay"></div>
          <div className="crt-scanlines"></div>
          <div className="crt-distortion"></div>
          <div className="crt-color-shift"></div>
          <div className="crt-vignette"></div>
          <div className="crt-flicker"></div>
          <div className="crt-ghosting"></div>
          <div className="vintage-color-grade"></div>
          <div className="digital-artifacts"></div>
          <div className="crt-curvature"></div>
          <div className="vintage-noise"></div>
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
              <div className="flex flex-col items-center space-y-6 animate-fade-in">
                <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <div className="text-caption text-white">loading gallery</div>
              </div>
            </div>
          )}
          
          {/* Static neon liquid digital art background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
            <div className="jarring-element"></div>
          </div>

          {/* Focused view overlay */}
          {isFocused && focusedItem && (
            <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-md z-20 flex items-center justify-center">
              <div className="text-center text-white max-w-2xl mx-auto p-8">
                <h2 className="text-display text-4xl mb-4 font-black tracking-tight">
                  {focusedItem.title}
                </h2>
                <p className="text-body text-lg mb-6 opacity-90">
                  {focusedItem.type === 'video' ? 'Video' : 'Image'} • Click to return to gallery
                </p>
                {focusedItem.type === 'video' && (focusedItem.src.includes('youtube.com') || focusedItem.src.includes('youtu.be')) && (
                  <div className="mb-6">
                    <p className="text-caption mb-2">YouTube video opened in new tab</p>
                    <a 
                      href={focusedItem.src} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block bg-orange-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-orange-300 transition-colors"
                    >
                      Open Video
                    </a>
                  </div>
                )}
                <button 
                  onClick={() => {
                    setIsFocused(false);
                    setFocusedItem(null);
                    setActiveVideo(null);
                  }}
                  className="text-distorted text-white hover:text-orange-300 transition-colors tracking-wider"
                >
                  ← return to gallery
                </button>
              </div>
            </div>
          )}

          {/* Main text overlay - only show when not focused */}
          {!isFocused && (
            <div className="absolute top-1/2 left-8 transform -translate-y-1/2 text-white animate-fade-in-up text-left z-10 bg-black bg-opacity-20 backdrop-blur-sm rounded-lg p-10 max-w-lg shadow-xl">
              <h1 className="text-display text-5xl mb-6 font-black tracking-tight">a byjustinwu curation</h1>
              <p className="text-distorted text-white mb-4 text-2xl tracking-wider ml-2">08/14/25</p>
              <p className="text-body text-sm text-white opacity-90 tracking-wide">
                {isExhibitionMode ? 'exhibition mode • auto-rotating' : 'hover to explore • click to open'}
              </p>
            </div>
          )}

          {/* Status indicators - positioned to avoid overlap */}
          {!isFocused && (
            <div className="absolute top-12 right-12 flex flex-col items-end space-y-3 max-w-xs">
              {isExhibitionMode && exhibitionVideo && (
                <div className="text-stretched text-white animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-lg"></div>
                    <span className="tracking-wider">playing</span>
                  </div>
                </div>
              )}
              
              {/* Exhibition mode toggle */}
              <button 
                onClick={() => {
                  setIsExhibitionMode(!isExhibitionMode);
                  if (focusTimerRef.current) {
                    clearTimeout(focusTimerRef.current);
                  }
                  if (!isExhibitionMode) {
                    setTimeout(startExhibitionMode, 1000);
                  }
                }}
                className="text-distorted text-white hover:text-orange-300 transition-colors tracking-wider"
              >
                {isExhibitionMode ? 'exhibition' : 'interactive'}
              </button>
            </div>
          )}

          {activeVideo && !isFocused && (
            <div className="absolute bottom-8 right-8 text-stretched text-white animate-fade-in max-w-xs">
              playing video
            </div>
          )}

          {/* Cool branding element with copyright */}
          <div className="absolute bottom-12 left-12 text-distorted text-white opacity-90 animate-fade-in max-w-xs">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-400 rounded-full shadow-lg"></div>
              <span className="tracking-wider">© 2025 byjustinwu</span>
            </div>
          </div>
        </div>
      );
};

export default Gallery3D;
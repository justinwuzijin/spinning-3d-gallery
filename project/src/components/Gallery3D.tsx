import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface MediaItem {
  id: string;
  type: 'video' | 'image';
  src: string;
  thumbnail?: string;
  title: string;
  prompt?: string;
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
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [focusedItem, setFocusedItem] = useState<MediaItem | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const lastMouseMoveRef = useRef<number>(0);

  const createVideoTexture = (item: MediaItem): Promise<THREE.Texture> => {
    return new Promise((resolve) => {
      console.log('Creating video texture for:', item.src);
      
      // Create fallback texture function with improved design
      const createFallbackTexture = (title: string, prompt?: string, type: string = 'video') => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Create a more appealing gradient background
          const gradient = ctx.createLinearGradient(0, 0, 320, 240);
          if (type === 'instagram') {
            gradient.addColorStop(0, '#833AB4');
            gradient.addColorStop(0.5, '#FD1D1D');
            gradient.addColorStop(1, '#F77737');
          } else {
            gradient.addColorStop(0, '#FF0000');
            gradient.addColorStop(0.5, '#CC0000');
            gradient.addColorStop(1, '#990000');
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 320, 240);
          
          // Add a subtle pattern overlay
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          for (let i = 0; i < 320; i += 20) {
            for (let j = 0; j < 240; j += 20) {
              if ((i + j) % 40 === 0) {
                ctx.fillRect(i, j, 10, 10);
              }
            }
          }
          
          // Add title text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(title, 160, 100);
          
          // Add prompt text if available
          if (prompt) {
            ctx.font = '12px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(prompt, 160, 120);
          }
          
          // Add type indicator
          ctx.font = '10px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.fillText(`Click to watch ${type}`, 160, 140);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;
        return texture;
      };
      
      // Handle YouTube URLs
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
            const fallbackTexture = createFallbackTexture(item.title, item.prompt, 'YouTube');
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
              const fallbackTexture = createFallbackTexture(item.title, item.prompt, 'YouTube');
              resolve(fallbackTexture);
            }
          );
        } else {
          console.log('Invalid YouTube URL, creating fallback');
          const fallbackTexture = createFallbackTexture(item.title, item.prompt, 'YouTube');
          resolve(fallbackTexture);
        }
      } else if (item.src.includes('instagram.com')) {
        // Handle Instagram URLs
        console.log('Instagram URL detected, creating fallback');
        const fallbackTexture = createFallbackTexture(item.title, item.prompt, 'Instagram');
        resolve(fallbackTexture);
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
    
    // Create a perfect spherical layout inspired by the reference article
    // Using Fibonacci sphere distribution for optimal spacing
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
      const radius_at_y = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment
      
      const x = Math.cos(theta) * radius_at_y;
      const z = Math.sin(theta) * radius_at_y;
      
      // Use consistent radius for perfect alignment - no random variation
      const scaledRadius = radius * 0.8; // Increased from 0.7 for bigger gallery
      points.push(new THREE.Vector3(x * scaledRadius, y * scaledRadius, z * scaledRadius));
    }
    
    return points;
  };

  const initScene = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera setup - Optimized for perfect spherical alignment
    const camera = new THREE.PerspectiveCamera(
      75, // Wider FOV for better visibility
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Position camera for optimal viewing of the spherical layout
    camera.position.set(0, 0, 28); // Further back for bigger gallery
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Much brighter lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create group for all media items
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);
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
              // For images, try to load the actual image first
              texture = await createImageTexture(item.src);
            }

            // Create plane geometry - optimized for perfect spherical alignment with rounded corners
            const geometry = new THREE.PlaneGeometry(3.2, 2.4); // Increased from 2.5, 1.8
            
            // Create a material with rounded corners effect using a simple approach
            const material = new THREE.MeshBasicMaterial({ 
              map: texture,
              transparent: true,
              opacity: 1.0,
              side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            const position = positions[index];
            
            mesh.position.copy(position);
            // Make each item face towards the center (inwards) for spherical effect
            mesh.lookAt(0, 0, 0);
            mesh.userData = { 
              item, 
              originalScale: { x: 1, y: 1, z: 1 },
              originalOpacity: 1.0,
              originalPosition: position.clone()
            };

            groupRef.current!.add(mesh);
            meshesRef.current.set(item.id, mesh);

          } catch (error) {
            console.error(`Error loading media item ${item.id}:`, error);
            // Create a fallback mesh even if loading fails
            const fallbackGeometry = new THREE.PlaneGeometry(3.2, 2.4); // Match the new size
            const fallbackMaterial = new THREE.MeshBasicMaterial({
              color: 0xff0000,
              transparent: true,
              opacity: 1.0,
              side: THREE.DoubleSide
            });
            const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
            const position = positions[index];
            fallbackMesh.position.copy(position);
            fallbackMesh.lookAt(0, 0, 0);
            fallbackMesh.userData = { item, originalScale: { x: 1, y: 1, z: 1 }, originalOpacity: 1.0 };
            groupRef.current!.add(fallbackMesh);
            meshesRef.current.set(item.id, fallbackMesh);
          }
        })();

        loadPromises.push(promise);
      });

      // Wait for all media items to load
      await Promise.all(loadPromises);
      setIsLoading(false);
      console.log('All media items loaded successfully');
    } catch (error) {
      console.error('Error in createMediaItems:', error);
      setIsLoading(false);
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isFocused) return; // Disable mouse control when focused
    
    // Throttle mouse movement to prevent spazzing (limit to 60fps)
    const now = Date.now();
    if (now - lastMouseMoveRef.current < 16) { // 16ms = ~60fps
      return;
    }
    lastMouseMoveRef.current = now;
    
    mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Increased sensitivity for full rotation around the sphere
    targetRotationRef.current.y = Math.max(-Math.PI, Math.min(Math.PI, mouseRef.current.x * 0.5)); // Clamp values
    targetRotationRef.current.x = Math.max(-Math.PI, Math.min(Math.PI, mouseRef.current.y * 0.5)); // Clamp values

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
          // If it's a video, open it directly in a new tab
          if (clickedItem.type === 'video') {
            window.open(clickedItem.src, '_blank');
            return; // Don't focus, just open the link
          }
          
          // For images, focus on the clicked item
          setIsFocused(true);
          setFocusedItem(clickedItem);
          setActiveVideo(clickedItem.id);
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
            const currentOpacity = (mesh.material as THREE.MeshBasicMaterial).opacity || 1.0;
            const newOpacity = currentOpacity + (0 - currentOpacity) * 0.1;
            (mesh.material as THREE.MeshBasicMaterial).opacity = newOpacity;
          }
        });
      }
    } else {
      // Normal gallery mode - interactive mouse control
      // Manual rotation with increased sensitivity and smoothing
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.02;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.02;

      groupRef.current.rotation.x = currentRotationRef.current.x;
      groupRef.current.rotation.y = currentRotationRef.current.y;

      // Gentle auto-rotation when mouse is not moving
      if (Math.abs(mouseRef.current.x) < 0.05 && Math.abs(mouseRef.current.y) < 0.05) {
        groupRef.current.rotation.y += 0.002;
      }

      // Interactive mode: show all items with hover effects
      meshesRef.current.forEach((mesh, id) => {
        const isActive = activeVideo === id;
        const isHovered = hoveredItem === id;
        
        let targetScale = 1;
        let targetOpacity = 1.0;
        
        if (isActive) {
          targetScale = 1.2;
          targetOpacity = 1.0;
        } else if (isHovered) {
          targetScale = 1.1;
          targetOpacity = 1.0;
        } else {
          targetScale = 1.0;
          targetOpacity = 1.0;
        }
        
        const currentScale = mesh.scale.x;
        const newScale = currentScale + (targetScale - currentScale) * 0.08;
        mesh.scale.setScalar(newScale);
        
        const currentOpacity = (mesh.material as THREE.MeshBasicMaterial).opacity || 1.0;
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
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="w-full h-full absolute inset-0 z-0" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white">loading gallery</div>
          </div>
        </div>
      )}

      {/* Focused view overlay */}
      {isFocused && focusedItem && (
        <div className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-md z-20 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl mx-auto p-8">
            {focusedItem.type === 'image' ? (
              <div className="mb-6">
                <img 
                  src={focusedItem.src} 
                  alt={focusedItem.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                />
              </div>
            ) : null}
            <h2 className="text-4xl mb-4 font-black tracking-tight">
              {focusedItem.title}
            </h2>
            <p className="text-lg mb-6 opacity-90">
              {focusedItem.type === 'video' ? 'Video' : 'Image'} • Click to return to gallery
            </p>
            {focusedItem.type === 'video' && (focusedItem.src.includes('youtube.com') || focusedItem.src.includes('youtu.be')) && (
              <div className="mb-6">
                <p className="mb-2">YouTube video opened in new tab</p>
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
              className="text-white hover:text-orange-300 transition-colors tracking-wider bg-black/40 backdrop-blur-md rounded-lg p-4 shadow-2xl"
            >
              ← return to gallery
            </button>
          </div>
        </div>
      )}

      {/* Main text overlay - only show when not focused */}
      {!isFocused && (
        <div className="absolute top-1/2 left-8 transform -translate-y-1/2 text-white text-left z-10">
          <h1 className="text-5xl mb-6 font-black tracking-tight drop-shadow-2xl">a byjustinwu curation</h1>
          <p className="mb-4 text-lg tracking-wider ml-2 drop-shadow-2xl">© 2025 byjustinwu</p>
          <p className="text-sm opacity-95 tracking-wide drop-shadow-lg">
            hover to explore • click to open
          </p>
        </div>
      )}
    </div>
  );
};

export default Gallery3D;
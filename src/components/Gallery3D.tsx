import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface MediaItem {
  id: string;
  type: 'video' | 'image';
  src: string;
  thumbnail?: string;
  title: string;
  prompt?: string;
  videoUrl?: string;
}

interface Gallery3DProps {
  mediaItems: MediaItem[];
  radius?: number;
}

const Gallery3D: React.FC<Gallery3DProps> = ({ mediaItems, radius = 12 }) => { // Increased default radius from 8 to 12
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
  const [error, setError] = useState<string | null>(null);
  const videosRef = useRef<HTMLVideoElement[]>([]);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Add debug logging
  useEffect(() => {
    console.log('Gallery3D mounted with:', { mediaItems: mediaItems?.length, radius });
    console.log('WebGL support:', !!window.WebGLRenderingContext);
    console.log('Three.js version:', THREE.REVISION);
  }, [mediaItems, radius]);

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
        videosRef.current.push(video); // Store video element in ref
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
    return new Promise((resolve) => {
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
        () => {
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
      
      // Use consistent radius for perfect alignment - increased for bigger gallery
      const scaledRadius = radius * 0.9; // Increased from 0.8 for even bigger gallery
      points.push(new THREE.Vector3(x * scaledRadius, y * scaledRadius, z * scaledRadius));
    }
    
    return points;
  };

  const initScene = () => {
    if (!mountRef.current) {
      console.error('Mount ref not available');
      setError('Mount element not found');
      return;
    }

    try {
      console.log('Initializing Three.js scene...');
      
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
      camera.position.set(0, 0, 35); // Further back for bigger gallery (increased from 28)
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
      console.log('Renderer added to DOM');

      // Much brighter lighting for better visibility
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.8); // Reduced from 2.5 to fix overexposure
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Reduced from 2.0 to fix overexposure
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Create group for all media items
      const group = new THREE.Group();
      groupRef.current = group;
      scene.add(group);
      
      console.log('Scene initialized successfully');
    } catch (error) {
      console.error('Error initializing scene:', error);
      setError(`Scene initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createMediaItems = async () => {
    if (!groupRef.current) {
      console.error('Group ref not available');
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
      console.log(`Creating ${mediaItems.length} media items...`);
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
            const geometry = new THREE.PlaneGeometry(4.0, 3.0); // Increased from 3.2, 2.4 for bigger items
            
            // Create a material with rounded corners effect using a simple approach
            const material = new THREE.MeshStandardMaterial({ 
              map: texture,
              transparent: true,
              opacity: 1.0,
              side: THREE.DoubleSide,
              emissive: new THREE.Color(0x000000),
              emissiveIntensity: 0.0
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
            console.log(`Created mesh for item ${item.id} at position:`, position);

          } catch (error) {
            console.error(`Error loading media item ${item.id}:`, error);
            // Create a fallback mesh even if loading fails
            const fallbackGeometry = new THREE.PlaneGeometry(4.0, 3.0); // Match the new size
            const fallbackMaterial = new THREE.MeshStandardMaterial({
              color: 0xff0000,
              transparent: true,
              opacity: 1.0,
              side: THREE.DoubleSide,
              emissive: new THREE.Color(0x000000),
              emissiveIntensity: 0.0
            });
            const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
            const position = positions[index];
            fallbackMesh.position.copy(position);
            fallbackMesh.lookAt(0, 0, 0);
            fallbackMesh.userData = { 
              item, 
              originalScale: { x: 1, y: 1, z: 1 }, 
              originalOpacity: 1.0,
              originalPosition: position.clone()
            };
            groupRef.current!.add(fallbackMesh);
            meshesRef.current.set(item.id, fallbackMesh);
            console.log(`Created fallback mesh for item ${item.id}`);
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
      setError(`Failed to create media items: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!cameraRef.current || !groupRef.current) return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update target rotation based on mouse position
    targetRotationRef.current.x = mouse.y * 0.5;
    targetRotationRef.current.y = mouse.x * 0.5;

    // Raycasting for hover effects
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    if (groupRef.current) {
      const meshes = Array.from(meshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes);
      
      let newHoveredItem: string | null = null;
      
      if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object as THREE.Mesh;
        const hoveredItem = intersectedMesh.userData.item as MediaItem;
        if (hoveredItem) {
          newHoveredItem = hoveredItem.id;
          // Change cursor to pointer when hovering over items
          document.body.style.cursor = 'pointer';
        }
      } else {
        // Reset cursor when not hovering over items
        document.body.style.cursor = 'default';
      }
      
      setHoveredItem(newHoveredItem);
    }
  };

  const handleClick = (event: MouseEvent) => {
    console.log('Click event triggered');
    
    if (isFocused) {
      console.log('Already focused, returning to gallery view');
      // If already focused, return to gallery view
      setIsFocused(false);
      setFocusedItem(null);
      setActiveVideo(null);
      return;
    }

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    console.log('Mouse coordinates:', { x: mouse.x, y: mouse.y });

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current!);

    if (groupRef.current) {
      // Use the meshes directly from our ref instead of group children
      const meshes: THREE.Mesh[] = Array.from(meshesRef.current.values());
      console.log('Checking intersection with', meshes.length, 'meshes');
      
      const intersects = raycaster.intersectObjects(meshes);
      console.log('Intersections found:', intersects.length);
      
      if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object as THREE.Mesh;
        const clickedItem = intersectedMesh.userData.item as MediaItem;
        
        console.log('Intersected mesh:', intersectedMesh);
        console.log('UserData:', intersectedMesh.userData);
        console.log('Clicked item:', clickedItem);
        
        if (clickedItem) {
          console.log('Successfully clicked on item:', clickedItem.title);
          // For all items, focus on the clicked item to show details
          setIsFocused(true);
          setFocusedItem(clickedItem);
          setActiveVideo(clickedItem.id);
          
          // If it's a video, also open it in a new tab
          if (clickedItem.type === 'video') {
            console.log('Opening video in new tab:', clickedItem.src);
            window.open(clickedItem.src, '_blank');
          }
        } else {
          console.warn('No item data found in intersected mesh');
        }
      } else {
        console.log('No intersections found');
      }
    } else {
      console.warn('Group ref not available');
    }
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !groupRef.current) {
      console.warn('Animation skipped - missing refs');
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
        const distance = 12; // Increased from 8 for better focus view
        const direction = new THREE.Vector3(0, 0, 1);
        const targetCameraPosition = targetPosition.clone().add(direction.multiplyScalar(distance));
        
        currentPosition.lerp(targetCameraPosition, 0.05);
        cameraRef.current.lookAt(targetPosition);
        
        // Scale up the focused item
        const targetScale = 2.5; // Increased from 2 for better focus view
        const currentScale = focusedMesh.scale.x;
        const newScale = currentScale + (targetScale - currentScale) * 0.1;
        focusedMesh.scale.setScalar(newScale);
        
        // Hide other items
        meshesRef.current.forEach((mesh, id) => {
          if (id !== focusedItem.id) {
            const currentOpacity = (mesh.material as THREE.MeshStandardMaterial).opacity || 1.0;
            const newOpacity = currentOpacity + (0 - currentOpacity) * 0.1;
            (mesh.material as THREE.MeshStandardMaterial).opacity = newOpacity;
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
          // Add subtle glow effect for hovered items
          (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x333333);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        } else {
          targetScale = 1.0;
          targetOpacity = 1.0;
          // Remove glow effect
          (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x000000);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.0;
        }
        
        // Smooth scale animation
        const currentScale = mesh.scale.x;
        const newScale = currentScale + (targetScale - currentScale) * 0.1;
        mesh.scale.setScalar(newScale);
        
        // Smooth opacity animation
        const currentOpacity = (mesh.material as THREE.MeshStandardMaterial).opacity || 1.0;
        const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.1;
        (mesh.material as THREE.MeshStandardMaterial).opacity = newOpacity;
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
      try {
        console.log('Starting gallery initialization...');
        initScene();
        await createMediaItems();
        console.log('Gallery initialization complete');
      } catch (error) {
        console.error('Gallery initialization failed:', error);
        setError(`Gallery initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initializeGallery();

    const handleMouseMoveWrapper = (event: MouseEvent) => handleMouseMove(event);
    const handleClickWrapper = (event: MouseEvent) => handleClick(event);
    const handleResizeWrapper = () => handleResize();

    window.addEventListener('mousemove', handleMouseMoveWrapper);
    window.addEventListener('click', handleClickWrapper);
    window.addEventListener('resize', handleResizeWrapper);

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveWrapper);
      window.removeEventListener('click', handleClickWrapper);
      window.removeEventListener('resize', handleResizeWrapper);
      
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
  }, []); // Remove mediaItems dependency to prevent infinite loops

  // Handle mediaItems changes separately
  useEffect(() => {
    if (groupRef.current && mediaItems && mediaItems.length > 0) {
      // Clear existing meshes
      groupRef.current.clear();
      meshesRef.current.clear();
      
      // Recreate media items
      createMediaItems();
    }
  }, [mediaItems]);

  // Show error if something went wrong
  if (error) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-2xl mx-auto p-8">
          <h2 className="text-3xl mb-4 font-bold text-red-400">Gallery Error</h2>
          <p className="mb-4 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

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
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => {
                    if (focusedItem.videoUrl) {
                      window.open(focusedItem.videoUrl, '_blank');
                    }
                  }}
                />
              </div>
            ) : null}
            <h2 className="text-4xl mb-4 font-black tracking-tight">
              {focusedItem.title}
            </h2>
            <p className="text-lg mb-6 opacity-90">
              {focusedItem.videoUrl ? (
                <span className="text-orange-300 font-medium">
                  🎬 Click on the image above to watch the video!
                </span>
              ) : (
                `${focusedItem.type === 'video' ? 'Video' : 'Image'} • Click to return to gallery`
              )}
            </p>
            {focusedItem.videoUrl && (
              <div className="mb-6 p-4 bg-white/10 rounded-lg backdrop-blur-md">
                <p className="text-sm opacity-80 mb-2">
                  {focusedItem.videoUrl.includes('youtube.com') || focusedItem.videoUrl.includes('youtu.be') 
                    ? 'YouTube Video' 
                    : focusedItem.videoUrl.includes('instagram.com') 
                    ? 'Instagram Video' 
                    : 'Video'
                  }
                </p>
                <a 
                  href={focusedItem.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-orange-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-orange-300 transition-colors"
                >
                  Open Video in New Tab
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
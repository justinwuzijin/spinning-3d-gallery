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

const Gallery3D: React.FC<Gallery3DProps> = ({ mediaItems, radius = 11 }) => { // Adjusted radius to better fit items within outline
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

      // Create GingerRoot-style abstract liquid digital art background
      const createLiquidBackground = () => {
        // Create a large sphere geometry for the background
        const backgroundGeometry = new THREE.SphereGeometry(100, 64, 64);
        
        // Create animated material with flowing liquid effect
        const backgroundMaterial = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
              vUv = uv;
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float time;
            uniform vec2 resolution;
            varying vec2 vUv;
            varying vec3 vPosition;
            
            // Noise functions for organic liquid movement
            float noise(vec3 p) {
              vec3 i = floor(p);
              vec3 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              
              float n = i.x + i.y * 157.0 + 113.0 * i.z;
              return fract(sin(n) * 43758.5453);
            }
            
            float fbm(vec3 p) {
              float value = 0.0;
              float amplitude = 0.5;
              float frequency = 0.0;
              
              for (int i = 0; i < 6; i++) {
                value += amplitude * noise(p);
                p *= 2.0;
                amplitude *= 0.5;
              }
              return value;
            }
            
            void main() {
              vec2 uv = vUv;
              vec3 pos = vPosition;
              
              // 90s TV screen effects
              // Add subtle screen vibration
              float vibration = sin(time * 15.0) * 0.002 + sin(time * 23.0) * 0.001;
              uv += vibration;
              
              // Add horizontal scan lines (like old CRT TVs)
              float scanlines = sin(uv.y * 200.0 + time * 2.0) * 0.1 + 0.9;
              
              // Add vertical jitter (like unstable signal)
              float jitter = sin(time * 7.0) * 0.001 + sin(time * 11.0) * 0.0005;
              uv.x += jitter;
              
              // Create flowing liquid effect with enhanced movement
              float flow = fbm(pos * 0.5 + time * 0.15);
              float flow2 = fbm(pos * 0.3 + time * 0.08 + vec3(10.0));
              float flow3 = fbm(pos * 0.7 + time * 0.12 + vec3(20.0));
              
              // Add TV screen curvature effect
              float curvature = 1.0 - (uv.x - 0.5) * (uv.x - 0.5) * 0.3 - (uv.y - 0.5) * (uv.y - 0.5) * 0.3;
              curvature = clamp(curvature, 0.0, 1.0);
              
              // GingerRoot-inspired color palette
              vec3 color1 = vec3(0.8, 0.2, 0.4); // Deep magenta
              vec3 color2 = vec3(0.2, 0.6, 0.8); // Electric blue
              vec3 color3 = vec3(0.9, 0.4, 0.1); // Vibrant orange
              vec3 color4 = vec3(0.1, 0.8, 0.6); // Cyan green
              
              // Blend colors based on flow patterns
              vec3 finalColor = mix(color1, color2, flow);
              finalColor = mix(finalColor, color3, flow2);
              finalColor = mix(finalColor, color4, flow3);
              
              // Add depth and variation with enhanced movement
              float depth = sin(pos.x * 2.5 + time * 0.3) * cos(pos.y * 2.5 + time * 0.25);
              finalColor += depth * 0.15;
              
              // Add TV screen flicker effect
              float flicker = sin(time * 8.0) * 0.05 + 0.95;
              finalColor *= flicker;
              
              // Add subtle glow effect
              float glow = sin(time * 0.5) * 0.1 + 0.9;
              finalColor *= glow;
              
              // Apply scan lines and curvature
              finalColor *= scanlines * curvature;
              
              // Add slight color bleeding (like old TVs)
              float bleed = sin(time * 3.0) * 0.02 + 0.98;
              finalColor.r *= bleed;
              finalColor.b *= 1.0 / bleed;
              
              // Fade edges for seamless integration
              float edge = 1.0 - smoothstep(0.4, 0.6, length(uv - vec2(0.5)));
              finalColor *= edge;
              
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.8
        });
        
        const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        scene.add(backgroundMesh);
        
        // Store reference for animation updates
        scene.userData.backgroundMaterial = backgroundMaterial;
        
        return backgroundMesh;
      };
      
            // Create and add the liquid background
      createLiquidBackground();
      
      // Create spherical outline to distinguish gallery from background
      const createGalleryOutline = () => {
        const outlineGeometry = new THREE.SphereGeometry(radius * 0.95, 64, 64);
        const outlineMaterial = new THREE.LineBasicMaterial({ 
          color: 0xffffff, 
          transparent: true, 
          opacity: 0.3,
          linewidth: 1
        });
        
        // Create wireframe outline
        const outline = new THREE.LineSegments(
          new THREE.WireframeGeometry(outlineGeometry),
          outlineMaterial
        );
        
        // Make outline slightly larger than the gallery items
        outline.scale.setScalar(1.05);
        scene.add(outline);
        
        // Store reference for animation
        scene.userData.galleryOutline = outline;
      };
      
      // Create the gallery outline
      createGalleryOutline();
      
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
            const geometry = new THREE.PlaneGeometry(5.5, 4.2); // Increased to better fill the spherical outline
            
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
            const fallbackGeometry = new THREE.PlaneGeometry(5.5, 4.2); // Match the new size
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
          
          // Removed video opening functionality for interactive art gallery experience
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

    // Animate the liquid background
    if (sceneRef.current.userData.backgroundMaterial) {
      sceneRef.current.userData.backgroundMaterial.uniforms.time.value += 0.01;
    }
    
    // Animate the gallery outline
    if (sceneRef.current.userData.galleryOutline) {
      const outline = sceneRef.current.userData.galleryOutline;
      // Subtle rotation that follows the gallery
      outline.rotation.y += 0.001;
      outline.rotation.x += 0.0005;
      
      // Subtle pulsing opacity effect
      const opacity = 0.3 + Math.sin(Date.now() * 0.002) * 0.1;
      (outline.material as THREE.LineBasicMaterial).opacity = opacity;
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
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                />
              </div>
            ) : null}
            <h2 className="text-4xl mb-4 font-black tracking-tight">
              {focusedItem.title}
            </h2>
            <p className="text-lg mb-6 opacity-90">
              {`${focusedItem.type === 'video' ? 'Video' : 'Image'} • Click to return to gallery`}
            </p>
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

      {/* Social Media Links */}
      <div className="absolute top-8 right-8 flex flex-col space-y-4 z-10">
        <a 
          href="https://x.com/byjustinwu" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-link group"
          title="Follow me on X"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-white group-hover:text-orange-300 transition-colors duration-200 drop-shadow-lg">
            <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        
        <a 
          href="https://www.instagram.com/byjustinwu/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-link group"
          title="Follow me on Instagram"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-white group-hover:text-pink-400 transition-colors duration-200 drop-shadow-lg">
            <path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
        
        <a 
          href="https://www.youtube.com/@byjustinwu" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-link group"
          title="Subscribe to my YouTube"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-white group-hover:text-red-400 transition-colors duration-200 drop-shadow-lg">
            <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>
        
        <a 
          href="https://www.linkedin.com/in/justin-wu-171481162/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-link group"
          title="Connect with me on LinkedIn"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-white group-hover:text-blue-400 transition-colors duration-200 drop-shadow-lg">
            <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default Gallery3D;
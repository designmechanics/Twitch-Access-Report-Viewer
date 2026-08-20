import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  category?: string;
  date?: string;
  color?: string;
}

interface ThreeDVisualizationProps {
  data: ChartDataPoint[];
  title?: string;
  yAxisLabel?: string;
  type?: 'bars' | 'scatter' | 'cylinders' | 'surface';
  height?: number;
  colorTheme?: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
}

export const ThreeDVisualization: React.FC<ThreeDVisualizationProps> = ({
  data,
  title,
  yAxisLabel = 'Value',
  type = 'bars',
  height = 320,
  colorTheme = 'twitch'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; value: number; category?: string } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current || !data || data.length === 0) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;

    // Palette setup
    const getThemeColors = () => {
      switch (colorTheme) {
        case 'cyberpunk':
          return [0x00f0ff, 0xff007f, 0x7000ff, 0x00ff66, 0xffe600];
        case 'emerald':
          return [0x10b981, 0x34d399, 0x059669, 0x6ee7b7, 0x047857];
        case 'amber':
          return [0xf59e0b, 0xfbbf24, 0xd97706, 0xfde68a, 0xb45309];
        case 'twitch':
        default:
          return [0x9146ff, 0xbf94ff, 0x772ce8, 0x38bdf8, 0xa855f7];
      }
    };

    const colors = getThemeColors();

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121214);
    scene.fog = new THREE.FogExp2(0x121214, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 26);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const themePointLight = new THREE.PointLight(colors[0], 2.5, 50);
    themePointLight.position.set(-10, 10, 10);
    scene.add(themePointLight);

    const secondaryPointLight = new THREE.PointLight(colors[1] || 0x38bdf8, 1.5, 50);
    secondaryPointLight.position.set(10, 10, -10);
    scene.add(secondaryPointLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(24, 16, colors[0], 0x27272a);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Data Processing & Scaling
    const displayData = data.slice(0, 24); // Limit to top 24 for optimal 3D clarity
    const maxValue = Math.max(...displayData.map((d) => d.value), 1);
    const maxBarHeight = 9;

    const interactiveObjects: THREE.Object3D[] = [];
    const barSpacing = Math.min(1.4, 20 / Math.max(displayData.length, 1));
    const startX = -((displayData.length - 1) * barSpacing) / 2;

    displayData.forEach((item, index) => {
      const normalizedHeight = Math.max(0.4, (item.value / maxValue) * maxBarHeight);
      const colorHex = colors[index % colors.length];

      let mesh: THREE.Mesh;

      if (type === 'scatter') {
        const radius = Math.max(0.35, Math.min(1.0, (item.value / maxValue) * 1.0 + 0.3));
        const geometry = new THREE.SphereGeometry(radius, 24, 24);
        const material = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 0.3,
          roughness: 0.2,
          metalness: 0.6
        });
        mesh = new THREE.Mesh(geometry, material);
        // Vary along Z axis if category/secondary exists
        const zOffset = item.secondaryValue ? ((item.secondaryValue % 5) - 2) * 2 : (index % 3 - 1) * 2.5;
        mesh.position.set(startX + index * barSpacing, normalizedHeight, zOffset);

        // Add connecting stem
        const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, normalizedHeight, 8);
        const stemMat = new THREE.MeshBasicMaterial({ color: 0x3f3f46, transparent: true, opacity: 0.6 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.set(startX + index * barSpacing, normalizedHeight / 2, zOffset);
        scene.add(stem);
      } else if (type === 'cylinders') {
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, normalizedHeight, 20);
        const material = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.3,
          metalness: 0.4,
          emissive: colorHex,
          emissiveIntensity: 0.15
        });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(startX + index * barSpacing, normalizedHeight / 2, 0);
      } else {
        // Standard 3D Extruded Box
        const geometry = new THREE.BoxGeometry(0.75 * barSpacing, normalizedHeight, 0.9);
        const material = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.25,
          metalness: 0.5,
          emissive: colorHex,
          emissiveIntensity: 0.18
        });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(startX + index * barSpacing, normalizedHeight / 2, 0);
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { item, originalColor: colorHex };
      scene.add(mesh);
      interactiveObjects.push(mesh);
    });

    // Orbit Controls Simulation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationAngle = 0;
    let cameraY = 14;
    let cameraDistance = 26;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        rotationAngle -= deltaX * 0.008;
        cameraY = Math.max(3, Math.min(30, cameraY + deltaY * 0.05));

        camera.position.x = Math.sin(rotationAngle) * cameraDistance;
        camera.position.z = Math.cos(rotationAngle) * cameraDistance;
        camera.position.y = cameraY;
        camera.lookAt(0, 3, 0);

        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        // Raycasting for tooltips
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / width) * 2 - 1,
          -((e.clientY - rect.top) / height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects);

        if (intersects.length > 0) {
          const target = intersects[0].object as THREE.Mesh;
          if (target.userData?.item) {
            setHoveredPoint(target.userData.item);
            document.body.style.cursor = 'pointer';
            (target.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
          }
        } else {
          setHoveredPoint(null);
          document.body.style.cursor = 'default';
          interactiveObjects.forEach((obj) => {
            if ((obj as THREE.Mesh).material) {
              ((obj as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = 0.18;
            }
          });
        }
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistance = Math.max(12, Math.min(45, cameraDistance + e.deltaY * 0.03));
      camera.position.x = Math.sin(rotationAngle) * cameraDistance;
      camera.position.z = Math.cos(rotationAngle) * cameraDistance;
      camera.lookAt(0, 3, 0);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animationFrameId: number;
    let autoRotateTime = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isDragging) {
        autoRotateTime += 0.003;
        // Subtle floating rotation if not dragging
        camera.position.x = Math.sin(rotationAngle + Math.sin(autoRotateTime * 0.5) * 0.2) * cameraDistance;
        camera.position.z = Math.cos(rotationAngle + Math.sin(autoRotateTime * 0.5) * 0.2) * cameraDistance;
        camera.lookAt(0, 2.5, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      document.body.style.cursor = 'default';
    };
  }, [data, height, type, colorTheme]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-[#121214] select-none">
      {title && (
        <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#9146FF] animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-200">
            {title} &bull; 3D Interactive Canvas
          </span>
        </div>
      )}

      <div className="absolute top-3 right-4 z-10 text-[10px] font-mono text-gray-400 bg-black/40 px-2 py-1 rounded border border-white/10">
        Drag to Orbit &bull; Scroll to Zoom
      </div>

      <div ref={mountRef} style={{ height: `${height}px` }} className="w-full cursor-grab active:cursor-grabbing" />

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-20 pointer-events-none rounded-lg border border-[#9146FF]/50 bg-black/90 p-2.5 shadow-xl text-xs font-mono backdrop-blur-sm transform -translate-x-1/2 -translate-y-full mb-3 transition-all"
          style={{
            left: `${Math.max(80, Math.min(mousePos.x, (mountRef.current?.clientWidth || 500) - 80))}px`,
            top: `${Math.max(40, mousePos.y - 10)}px`
          }}
        >
          <p className="font-bold text-white text-[13px]">{hoveredPoint.label}</p>
          <div className="flex items-center gap-2 mt-1 text-[#bf94ff]">
            <span className="text-gray-400">{yAxisLabel}:</span>
            <span className="font-bold text-white">{hoveredPoint.value.toLocaleString()}</span>
          </div>
          {hoveredPoint.category && (
            <p className="text-[10px] text-gray-400 mt-0.5">{hoveredPoint.category}</p>
          )}
        </div>
      )}
    </div>
  );
};

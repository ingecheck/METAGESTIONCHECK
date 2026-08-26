import React, { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import {
  Box,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  Download,
  Filter,
  FileCode,
  Users,
  Compass,
  Scissors,
  Sparkles,
  Info,
  ExternalLink,
  MessageSquare,
  Clock,
  HardHat,
  Building,
} from "lucide-react";
import {
  ObraProyecto,
  ValorizacionMensual,
  BimModelData,
  BimElement,
  BimBcfIssue,
  PartidaEjecutada,
} from "../../types/obras";
import { LicenseSession } from "../../types/auth";

interface WorksBimViewerProps {
  obra: ObraProyecto;
  setObra: React.Dispatch<React.SetStateAction<ObraProyecto>>;
  valorizaciones: ValorizacionMensual[];
  partidas?: PartidaEjecutada[];
  currentUser: LicenseSession | null;
}

// Generate rich BIM elements based on Obra typology and scale
function generateDefaultBimElements(obra: ObraProyecto): BimElement[] {
  const elements: BimElement[] = [];
  const tipologia = obra.tipologia || "Edificaciones / Escuelas / Hospitales";

  if (tipologia === "Carreteras y Vías" || tipologia === "Defensa Ribereña / Puentes") {
    // Infrastructure / Bridge / Highway BIM Model
    // 1. Cimentación / Pilotes / Estribos
    elements.push(
      {
        id: "INF-CIM-01",
        name: "Estribo Izquierdo Concreto F'c=280",
        category: "Cimentación",
        discipline: "Cimentación",
        level: "Cimentación",
        partidaItemLink: "01.02.01",
        partidaNombre: "Concreto en Estribos y Pilotes",
        metradoBIM: 125.4,
        unidad: "m3",
        costoEstimado: 85000,
        mesValorizacionProgramado: 1,
        mesValorizacionEjecutado: 1,
        status4D: "Ejecutado",
        position: [-12, -2, 0],
        size: [5, 4, 10],
        color: "#64748b",
      },
      {
        id: "INF-CIM-02",
        name: "Estribo Derecho Concreto F'c=280",
        category: "Cimentación",
        discipline: "Cimentación",
        level: "Cimentación",
        partidaItemLink: "01.02.01",
        partidaNombre: "Concreto en Estribos y Pilotes",
        metradoBIM: 125.4,
        unidad: "m3",
        costoEstimado: 85000,
        mesValorizacionProgramado: 1,
        mesValorizacionEjecutado: 1,
        status4D: "Ejecutado",
        position: [12, -2, 0],
        size: [5, 4, 10],
        color: "#64748b",
      },
      {
        id: "INF-PIL-01",
        name: "Pilar Central 01",
        category: "Columnas",
        discipline: "Estructuras",
        level: "Nivel 1",
        partidaItemLink: "02.01.01",
        partidaNombre: "Pilares Centrales de Apoyo",
        metradoBIM: 84.0,
        unidad: "m3",
        costoEstimado: 62000,
        mesValorizacionProgramado: 2,
        mesValorizacionEjecutado: 2,
        status4D: "Ejecutado",
        position: [0, 0, 0],
        size: [4, 8, 8],
        color: "#475569",
      },
      {
        id: "INF-VIG-01",
        name: "Viga Postensada Tramo 1",
        category: "Vigas",
        discipline: "Estructuras",
        level: "Nivel 2",
        partidaItemLink: "02.02.01",
        partidaNombre: "Vigas Postensadas de Concreto Armado",
        metradoBIM: 95.0,
        unidad: "m3",
        costoEstimado: 120000,
        mesValorizacionProgramado: 3,
        status4D: "En Proceso",
        position: [-6, 4.5, 0],
        size: [12, 1.8, 4],
        color: "#3b82f6",
      },
      {
        id: "INF-VIG-02",
        name: "Viga Postensada Tramo 2",
        category: "Vigas",
        discipline: "Estructuras",
        level: "Nivel 2",
        partidaItemLink: "02.02.01",
        partidaNombre: "Vigas Postensadas de Concreto Armado",
        metradoBIM: 95.0,
        unidad: "m3",
        costoEstimado: 120000,
        mesValorizacionProgramado: 3,
        status4D: "En Proceso",
        position: [6, 4.5, 0],
        size: [12, 1.8, 4],
        color: "#3b82f6",
      },
      {
        id: "INF-LOS-01",
        name: "Losa de Tablero de Rodadura",
        category: "Losas",
        discipline: "Estructuras",
        level: "Nivel 3",
        partidaItemLink: "02.03.01",
        partidaNombre: "Losa de Concreto Armado Tablero",
        metradoBIM: 310.0,
        unidad: "m2",
        costoEstimado: 180000,
        mesValorizacionProgramado: 4,
        status4D: "Programado",
        position: [0, 5.8, 0],
        size: [30, 0.6, 9],
        color: "#0284c7",
      },
      {
        id: "INF-PAV-01",
        name: "Carpeta Asfáltica en Caliente e=2\"",
        category: "Acabados",
        discipline: "Arquitectura",
        level: "Nivel 3",
        partidaItemLink: "03.01.01",
        partidaNombre: "Pavimento Asfáltico y Señalización",
        metradoBIM: 280.0,
        unidad: "m2",
        costoEstimado: 75000,
        mesValorizacionProgramado: 5,
        status4D: "Programado",
        position: [0, 6.2, 0],
        size: [30, 0.2, 8],
        color: "#1e293b",
      }
    );
  } else {
    // Multi-story Building (Hospital, School, Public Building)
    const gridSize = 3;
    const spacingX = 6;
    const spacingZ = 6;

    // 1. Zapatas y Cimientos
    for (let x = -gridSize; x <= gridSize; x += gridSize) {
      for (let z = -gridSize; z <= gridSize; z += gridSize) {
        elements.push({
          id: `ZAP-${x}-${z}`,
          name: `Zapata Aislada Z-1 [Eje ${x >= 0 ? "B" : "A"}-${z >= 0 ? "2" : "1"}]`,
          category: "Cimentación",
          discipline: "Cimentación",
          level: "Cimentación",
          partidaItemLink: "01.02.01",
          partidaNombre: "Zapatas: Concreto F'c=210 kg/cm2",
          metradoBIM: 3.8,
          unidad: "m3",
          costoEstimado: 4200,
          mesValorizacionProgramado: 1,
          mesValorizacionEjecutado: 1,
          status4D: "Ejecutado",
          position: [x * 2.2, -2, z * 2.2],
          size: [2.4, 0.8, 2.4],
          color: "#64748b",
        });
      }
    }

    // 2. Vigas de Cimentación
    elements.push({
      id: "VC-LONG-01",
      name: "Viga de Cimentación VC-101 Eje 1",
      category: "Cimentación",
      discipline: "Cimentación",
      level: "Cimentación",
      partidaItemLink: "01.02.03",
      partidaNombre: "Vigas de Cimentación Concreto",
      metradoBIM: 12.5,
      unidad: "m3",
      costoEstimado: 14500,
      mesValorizacionProgramado: 1,
      mesValorizacionEjecutado: 1,
      status4D: "Ejecutado",
      position: [0, -1.6, -6.6],
      size: [15, 0.6, 0.6],
      color: "#94a3b8",
    });

    // 3. Columnas Piso 1
    for (let x = -gridSize; x <= gridSize; x += gridSize) {
      for (let z = -gridSize; z <= gridSize; z += gridSize) {
        elements.push({
          id: `COL-P1-${x}-${z}`,
          name: `Columna C-01 (0.50x0.50) Nivel 1`,
          category: "Columnas",
          discipline: "Estructuras",
          level: "Nivel 1",
          partidaItemLink: "02.01.01",
          partidaNombre: "Columnas: Concreto F'c=210 kg/cm2",
          metradoBIM: 0.9,
          unidad: "m3",
          costoEstimado: 1850,
          mesValorizacionProgramado: 2,
          mesValorizacionEjecutado: 2,
          status4D: "Ejecutado",
          position: [x * 2.2, 0.5, z * 2.2],
          size: [0.7, 3.8, 0.7],
          color: "#3b82f6",
        });
      }
    }

    // 4. Muros de Albañilería Piso 1
    elements.push(
      {
        id: "MUR-P1-01",
        name: "Muro Ladrillo King Kong Soga Eje A",
        category: "Muros",
        discipline: "Arquitectura",
        level: "Nivel 1",
        partidaItemLink: "03.01.01",
        partidaNombre: "Muros de Ladrillo KK Tipo IV",
        metradoBIM: 45.2,
        unidad: "m2",
        costoEstimado: 8900,
        mesValorizacionProgramado: 2,
        mesValorizacionEjecutado: 2,
        status4D: "Ejecutado",
        position: [-6.6, 0.5, 0],
        size: [0.3, 3.6, 12],
        color: "#f97316",
      },
      {
        id: "MUR-P1-02",
        name: "Muro Ladrillo King Kong Soga Eje B",
        category: "Muros",
        discipline: "Arquitectura",
        level: "Nivel 1",
        partidaItemLink: "03.01.01",
        partidaNombre: "Muros de Ladrillo KK Tipo IV",
        metradoBIM: 45.2,
        unidad: "m2",
        costoEstimado: 8900,
        mesValorizacionProgramado: 2,
        status4D: "En Proceso",
        position: [6.6, 0.5, 0],
        size: [0.3, 3.6, 12],
        color: "#ea580c",
      }
    );

    // 5. Redes Sanitarias y Eléctricas Piso 1 (MEP)
    elements.push(
      {
        id: "MEP-SAN-P1",
        name: "Troncal Desagüe PVC SAL 4\" Piso 1",
        category: "Sanitarias",
        discipline: "Instalaciones Sanitarias",
        level: "Nivel 1",
        partidaItemLink: "04.01.01",
        partidaNombre: "Tuberías de PVC Desagüe 4\"",
        metradoBIM: 36.0,
        unidad: "m",
        costoEstimado: 6400,
        mesValorizacionProgramado: 2,
        status4D: "En Proceso",
        position: [0, -1.2, 0],
        size: [14, 0.25, 0.25],
        color: "#06b6d4",
      },
      {
        id: "MEP-ELE-P1",
        name: "Alimentador Principal Tablero General TG-01",
        category: "Eléctricas",
        discipline: "Instalaciones Eléctricas",
        level: "Nivel 1",
        partidaItemLink: "05.01.01",
        partidaNombre: "Tableros y Conductores N2XH",
        metradoBIM: 55.0,
        unidad: "m",
        costoEstimado: 11200,
        mesValorizacionProgramado: 3,
        status4D: "Programado",
        position: [-6.4, 1.2, -4],
        size: [0.4, 1.2, 0.8],
        color: "#eab308",
      }
    );

    // 6. Losa Aligerada Nivel 2
    elements.push({
      id: "LOSA-N2-01",
      name: "Losa Aligerada e=0.20m Nivel 2",
      category: "Losas",
      discipline: "Estructuras",
      level: "Nivel 2",
      partidaItemLink: "02.03.01",
      partidaNombre: "Losa Aligerada e=0.20m Concreto F'c=210",
      metradoBIM: 165.0,
      unidad: "m2",
      costoEstimado: 38500,
      mesValorizacionProgramado: 3,
      status4D: "En Proceso",
      position: [0, 2.5, 0],
      size: [15, 0.4, 15],
      color: "#2563eb",
    });

    // 7. Columnas Piso 2
    for (let x = -gridSize; x <= gridSize; x += gridSize) {
      for (let z = -gridSize; z <= gridSize; z += gridSize) {
        elements.push({
          id: `COL-P2-${x}-${z}`,
          name: `Columna C-01 Nivel 2`,
          category: "Columnas",
          discipline: "Estructuras",
          level: "Nivel 2",
          partidaItemLink: "02.01.01",
          partidaNombre: "Columnas Concreto F'c=210 kg/cm2",
          metradoBIM: 0.9,
          unidad: "m3",
          costoEstimado: 1850,
          mesValorizacionProgramado: 3,
          status4D: "Programado",
          position: [x * 2.2, 4.6, z * 2.2],
          size: [0.6, 3.8, 0.6],
          color: "#60a5fa",
        });
      }
    }

    // 8. Losa Techo / Azotea
    elements.push({
      id: "LOSA-AZO-01",
      name: "Losa Aligerada de Azotea e=0.20m",
      category: "Cubierta",
      discipline: "Estructuras",
      level: "Azotea / Techo",
      partidaItemLink: "02.03.01",
      partidaNombre: "Losa Aligerada Techo y Cobertura",
      metradoBIM: 165.0,
      unidad: "m2",
      costoEstimado: 39000,
      mesValorizacionProgramado: 4,
      status4D: "Programado",
      position: [0, 6.7, 0],
      size: [15.4, 0.35, 15.4],
      color: "#1d4ed8",
    });
  }

  return elements;
}

export const WorksBimViewer: React.FC<WorksBimViewerProps> = ({
  obra,
  setObra,
  valorizaciones,
  partidas = [],
  currentUser,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const reqIdRef = useRef<number | null>(null);

  // Active Team Member Info
  const activeMember = currentUser?.activeMemberId && currentUser?.teamMembers
    ? currentUser.teamMembers.find((m) => m.id === currentUser.activeMemberId)
    : null;
  const currentAuthorName = activeMember?.name || currentUser?.userName || "Plantel Técnico";
  const currentAuthorRole = activeMember?.cargoText || activeMember?.role || "Ingeniero Colegiado";

  // BIM State
  const [elements, setElements] = useState<BimElement[]>(() => {
    if (obra.bimModel?.elementos && obra.bimModel.elementos.length > 0) {
      return obra.bimModel.elementos;
    }
    return generateDefaultBimElements(obra);
  });

  const [bcfIssues, setBcfIssues] = useState<BimBcfIssue[]>(() => {
    return obra.bimModel?.incidenciasBCF || [
      {
        id: "BCF-001",
        titulo: "Interferencia Tubería Sanitaria 4\" con Viga V-101",
        descripcion: "Pase de tubería de desagüe atraviesa la zona de confinamiento de la viga principal en Eje B-2. Se requiere replanteo con curva de desviación.",
        creadoPor: "Ing. Marco Aurelio (Supervisor)",
        cargo: "Supervisor de Obra",
        tipo: "Interferencia / Clash",
        prioridad: "Alta",
        estado: "En Revisión",
        fecha: "2026-08-20",
        disciplinaAfectada: "Instalaciones Sanitarias",
        elementoId: "MEP-SAN-P1",
      },
      {
        id: "BCF-002",
        titulo: "Verificación de Recubrimiento en Zapatas Z-1",
        descripcion: "Se verificó recubrimiento de 7.5 cm según E.060. Conforme para vaciado de concreto F'c=210 kg/cm2.",
        creadoPor: "Ing. Juan Pérez (Residente)",
        cargo: "Residente de Obra",
        tipo: "Conformidad de Supervisor",
        prioridad: "Media",
        estado: "Subsanado / Aprobado",
        fecha: "2026-08-15",
        disciplinaAfectada: "Cimentación",
        elementoId: "ZAP-0-0",
      },
    ];
  });

  // Controls & Filters
  const [selectedElement, setSelectedElement] = useState<BimElement | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"3D" | "4D_SIM" | "5D_COSTS" | "BCF_ISSUES">("3D");
  const [activeMonth4D, setActiveMonth4D] = useState<number>(valorizaciones.length || 2);
  const [isPlaying4D, setIsPlaying4D] = useState<boolean>(false);
  const [sectionHeight, setSectionHeight] = useState<number>(10);
  const [isSectionCutActive, setIsSectionCutActive] = useState<boolean>(false);
  const [isNewBcfModalOpen, setIsNewBcfModalOpen] = useState<boolean>(false);

  // New BCF Form State
  const [newBcfTitle, setNewBcfTitle] = useState("");
  const [newBcfDesc, setNewBcfDesc] = useState("");
  const [newBcfType, setNewBcfType] = useState<BimBcfIssue["tipo"]>("Interferencia / Clash");
  const [newBcfPriority, setNewBcfPriority] = useState<BimBcfIssue["prioridad"]>("Alta");

  // Mouse Interaction (Raycasting)
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  // Save changes to Obra package and sync across entity
  const syncBimModelToObra = (updatedElements: BimElement[], updatedBcf: BimBcfIssue[]) => {
    const updatedModel: BimModelData = {
      id: obra.bimModel?.id || `BIM-${obra.id}`,
      obraId: obra.id,
      nombreModelo: obra.bimModel?.nombreModelo || `Modelo BIM Digital Twin - ${obra.nombre}`,
      formato: "Digital Twin 4D/5D",
      lodNivel: "LOD 350",
      fechaActualizacion: new Date().toISOString(),
      modificadoPor: `${currentAuthorName} (${currentAuthorRole})`,
      elementos: updatedElements,
      incidenciasBCF: updatedBcf,
      totalElementos: updatedElements.length,
      volumenConcretoM3: updatedElements.reduce(
        (acc, el) => (el.unidad === "m3" ? acc + el.metradoBIM : acc),
        0
      ),
      areaConstruidaM2: updatedElements.reduce(
        (acc, el) => (el.unidad === "m2" ? acc + el.metradoBIM : acc),
        0
      ),
    };

    setObra((prev) => ({
      ...prev,
      bimModel: updatedModel,
      lastModifiedBy: {
        memberId: activeMember?.id,
        name: currentAuthorName,
        role: currentAuthorRole,
        timestamp: new Date().toISOString(),
      },
    }));
  };

  // Setup Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 520;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090d16");
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(22, 16, 26);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(30, 45, 25);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.4);
    dirLight2.position.set(-25, 20, -20);
    scene.add(dirLight2);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(50, 50, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -2.5;
    scene.add(gridHelper);

    // Simple Orbit / Mouse rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const domElem = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      const radius = camera.position.distanceTo(new THREE.Vector3(0, 2, 0));
      const theta = Math.atan2(camera.position.x, camera.position.z) - deltaX * 0.008;
      const phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, Math.acos(camera.position.y / radius) + deltaY * 0.008)
      );

      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 2, 0);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.02;
      const dir = camera.position.clone().sub(new THREE.Vector3(0, 2, 0)).normalize();
      const currentDist = camera.position.distanceTo(new THREE.Vector3(0, 2, 0));
      const newDist = Math.max(5, Math.min(100, currentDist + zoomFactor));
      camera.position.copy(dir.multiplyScalar(newDist).add(new THREE.Vector3(0, 2, 0)));
      camera.lookAt(0, 2, 0);
    };

    const onClick = (e: MouseEvent) => {
      const rect = domElem.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(meshMapRef.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const elemId = hitMesh.userData.elementId;
        const found = elements.find((el) => el.id === elemId);
        if (found) {
          setSelectedElement(found);
        }
      }
    };

    domElem.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domElem.addEventListener("wheel", onWheel, { passive: false });
    domElem.addEventListener("click", onClick);

    // Animation Loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      domElem.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domElem.removeEventListener("wheel", onWheel);
      domElem.removeEventListener("click", onClick);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update 3D Meshes when Elements, Filters, Section Cut, or 4D Time changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear existing meshes
    meshMapRef.current.forEach((mesh) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    meshMapRef.current.clear();

    // Recreate 3D elements
    elements.forEach((el) => {
      // Check Filter by Discipline
      if (selectedDiscipline !== "ALL" && el.discipline !== selectedDiscipline) {
        return;
      }
      // Check Filter by Level
      if (selectedLevel !== "ALL" && el.level !== selectedLevel) {
        return;
      }
      // Check Section Cut Box
      if (isSectionCutActive && el.position[1] > sectionHeight) {
        return;
      }

      // Determine 4D Color & Opacity
      let meshColor = el.color || "#3b82f6";
      let meshOpacity = 0.92;
      let isTransparent = false;

      if (viewMode === "4D_SIM") {
        if (el.mesValorizacionProgramado <= activeMonth4D) {
          if (el.mesValorizacionProgramado === activeMonth4D) {
            meshColor = "#eab308"; // Amber / In Progress this month
          } else {
            meshColor = "#10b981"; // Green / Completed & Certified
          }
        } else {
          // Future planned item
          meshColor = "#475569";
          meshOpacity = 0.22;
          isTransparent = true;
        }
      }

      // Highlight if selected
      if (selectedElement?.id === el.id) {
        meshColor = "#f43f5e"; // Glowing rose pink for selected
        meshOpacity = 1.0;
      }

      const geom = new THREE.BoxGeometry(el.size[0], el.size[1], el.size[2]);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(meshColor),
        roughness: 0.35,
        metalness: 0.25,
        transparent: isTransparent || meshOpacity < 1,
        opacity: meshOpacity,
        wireframe: false,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(el.position[0], el.position[1], el.position[2]);
      if (el.rotation) {
        mesh.rotation.set(el.rotation[0], el.rotation[1], el.rotation[2]);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { elementId: el.id };

      // Add edge line highlight for architectural crispness
      const edges = new THREE.EdgesGeometry(geom);
      const lineMat = new THREE.LineBasicMaterial({
        color: selectedElement?.id === el.id ? 0xffffff : 0x1e293b,
        linewidth: 1,
      });
      const line = new THREE.LineSegments(edges, lineMat);
      mesh.add(line);

      scene.add(mesh);
      meshMapRef.current.set(el.id, mesh);
    });
  }, [
    elements,
    selectedDiscipline,
    selectedLevel,
    viewMode,
    activeMonth4D,
    sectionHeight,
    isSectionCutActive,
    selectedElement?.id,
  ]);

  // 4D Timeline Playback interval
  useEffect(() => {
    if (!isPlaying4D) return;
    const maxMonths = Math.max(valorizaciones.length || 1, 6);
    const timer = setInterval(() => {
      setActiveMonth4D((prev) => {
        if (prev >= maxMonths) {
          setIsPlaying4D(false);
          return maxMonths;
        }
        return prev + 1;
      });
    }, 1400);

    return () => clearInterval(timer);
  }, [isPlaying4D, valorizaciones.length]);

  // Add BCF Issue
  const handleAddBcfIssue = () => {
    if (!newBcfTitle.trim()) return;

    const newIssue: BimBcfIssue = {
      id: `BCF-${String(bcfIssues.length + 1).padStart(3, "0")}`,
      titulo: newBcfTitle.trim(),
      descripcion: newBcfDesc.trim() || "Sin descripción adicional.",
      creadoPor: `${currentAuthorName} (${currentAuthorRole})`,
      cargo: currentAuthorRole,
      tipo: newBcfType,
      prioridad: newBcfPriority,
      estado: "Abierto",
      fecha: new Date().toISOString().split("T")[0],
      elementoId: selectedElement?.id,
      disciplinaAfectada: selectedElement?.discipline || "Estructuras",
    };

    const updated = [newIssue, ...bcfIssues];
    setBcfIssues(updated);
    syncBimModelToObra(elements, updated);
    setNewBcfTitle("");
    setNewBcfDesc("");
    setIsNewBcfModalOpen(false);
  };

  // Reset Camera View
  const handleResetCamera = (viewType: "ISO" | "TOP" | "FRONT" | "SIDE") => {
    if (!cameraRef.current) return;
    if (viewType === "ISO") {
      cameraRef.current.position.set(22, 16, 26);
    } else if (viewType === "TOP") {
      cameraRef.current.position.set(0, 35, 0.1);
    } else if (viewType === "FRONT") {
      cameraRef.current.position.set(0, 4, 32);
    } else if (viewType === "SIDE") {
      cameraRef.current.position.set(32, 4, 0);
    }
    cameraRef.current.lookAt(0, 2, 0);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Banner: Unified Real-Time Plantel Técnico & BIM Suite */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shrink-0">
            <Box className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>EXPERIENCIA BIM & DIGITAL TWIN 4D/5D</span>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-400/30">
                  LOD 350
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Base de Datos Única en Tiempo Real • {obra.entidad || "Entidad Contratante"}
            </p>
          </div>
        </div>

        {/* Plantel Técnico Collaboration Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-[11px]">
              <span className="text-slate-400">Usuario Activo: </span>
              <span className="font-bold text-emerald-400">{currentAuthorName}</span>
              <span className="text-slate-400 text-[10px]"> ({currentAuthorRole})</span>
            </div>
          </div>

          <div className="bg-indigo-950/60 border border-indigo-700/50 px-3 py-1.5 rounded-xl text-[11px] text-indigo-200 flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Plantel Sincronizado</span>
          </div>
        </div>
      </div>

      {/* Main BIM Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: 3D Viewport + Overlays */}
        <div className="lg:col-span-8 space-y-3">
          {/* Viewport Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* 3D WebGL Canvas Container */}
            <div
              ref={mountRef}
              className="w-full h-[520px] cursor-grab active:cursor-grabbing relative"
            />

            {/* Top Viewport Toolbar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              {/* Mode Tabs */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 shadow-lg pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("3D")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    viewMode === "3D"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Modelo 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("4D_SIM")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    viewMode === "4D_SIM"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Simulación 4D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("5D_COSTS")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    viewMode === "5D_COSTS"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Partidas 5D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("BCF_ISSUES")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    viewMode === "BCF_ISSUES"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Incidencias BCF ({bcfIssues.length})</span>
                </button>
              </div>

              {/* Camera Views Quick Switch */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 shadow-lg pointer-events-auto text-[11px] font-semibold text-slate-300">
                <button
                  type="button"
                  onClick={() => handleResetCamera("ISO")}
                  className="px-2 py-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Vista Isométrica"
                >
                  ISO
                </button>
                <button
                  type="button"
                  onClick={() => handleResetCamera("TOP")}
                  className="px-2 py-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Vista Superior / Planta"
                >
                  PLANTA
                </button>
                <button
                  type="button"
                  onClick={() => handleResetCamera("FRONT")}
                  className="px-2 py-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Vista Frontal"
                >
                  FRONTAL
                </button>
                <button
                  type="button"
                  onClick={() => handleResetCamera("SIDE")}
                  className="px-2 py-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Vista Lateral"
                >
                  LATERAL
                </button>
              </div>
            </div>

            {/* Bottom Floating 4D Timeline Bar (when in 4D Simulation Mode) */}
            {viewMode === "4D_SIM" && (
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaying4D(!isPlaying4D)}
                      className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition cursor-pointer"
                    >
                      {isPlaying4D ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying4D(false);
                        setActiveMonth4D(1);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                      title="Reiniciar a Mes 1"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-amber-300">
                      Cronograma de Avance: Mes {activeMonth4D}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Ejecutado</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Mes Activo</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-600 opacity-40" />
                      <span>Futuro</span>
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={1}
                  max={Math.max(valorizaciones.length || 1, 6)}
                  value={activeMonth4D}
                  onChange={(e) => {
                    setIsPlaying4D(false);
                    setActiveMonth4D(Number(e.target.value));
                  }}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            )}

            {/* Bottom Controls (Discipline & Level Filters) */}
            {viewMode === "3D" && (
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Discipline Filter */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 font-semibold text-[11px]">Disciplina:</span>
                  <select
                    value={selectedDiscipline}
                    onChange={(e) => setSelectedDiscipline(e.target.value)}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Todas las Disciplinas</option>
                    <option value="Cimentación">Cimentación</option>
                    <option value="Estructuras">Estructuras</option>
                    <option value="Arquitectura">Arquitectura</option>
                    <option value="Instalaciones Sanitarias">Instalaciones Sanitarias (MEP)</option>
                    <option value="Instalaciones Eléctricas">Instalaciones Eléctricas (MEP)</option>
                  </select>
                </div>

                {/* Level Filter */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 font-semibold text-[11px]">Nivel:</span>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Todos los Niveles</option>
                    <option value="Cimentación">Cimentación / Zapatas</option>
                    <option value="Nivel 1">Nivel 1 (Piso 1)</option>
                    <option value="Nivel 2">Nivel 2 (Piso 2)</option>
                    <option value="Nivel 3">Nivel 3</option>
                    <option value="Azotea / Techo">Azotea / Techo</option>
                  </select>
                </div>

                {/* Section Cut Tool */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsSectionCutActive(!isSectionCutActive)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                      isSectionCutActive
                        ? "bg-rose-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Corte Z</span>
                  </button>
                  {isSectionCutActive && (
                    <input
                      type="range"
                      min={-2}
                      max={12}
                      step={0.5}
                      value={sectionHeight}
                      onChange={(e) => setSectionHeight(Number(e.target.value))}
                      className="w-20 accent-rose-500"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Guidance Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Controles 3D:</strong> Clic izquierdo + Arrastrar para rotar órbita • Rueda
                para Zoom • Clic sobre cualquier elemento para inspeccionar metrados y partidas.
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono shrink-0">
              {elements.length} elementos cargados
            </span>
          </div>
        </div>

        {/* Right Column: Inspector / BCF / 5D Partidas Link */}
        <div className="lg:col-span-4 space-y-4">
          {/* Element Inspector Card */}
          {selectedElement ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {selectedElement.id} • {selectedElement.discipline}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                    {selectedElement.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedElement(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Nivel / Piso:</span>
                  <span className="font-bold text-slate-800">{selectedElement.level}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Categoría BIM:</span>
                  <span className="font-bold text-slate-800">{selectedElement.category}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Metrado Computado:</span>
                  <span className="font-bold text-blue-700">
                    {selectedElement.metradoBIM} {selectedElement.unidad}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Estado 4D:</span>
                  <span
                    className={`font-bold ${
                      selectedElement.status4D === "Ejecutado"
                        ? "text-emerald-600"
                        : selectedElement.status4D === "En Proceso"
                        ? "text-amber-600"
                        : "text-slate-600"
                    }`}
                  >
                    {selectedElement.status4D}
                  </span>
                </div>
              </div>

              {/* Linked Partida Info */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs space-y-1">
                <div className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                  <FileCode className="w-3 h-3" />
                  <span>VINCULACIÓN PARTIDA 5D (PRESUPUESTO)</span>
                </div>
                <div className="font-bold text-slate-800">
                  Item {selectedElement.partidaItemLink || "01.01"}:{" "}
                  {selectedElement.partidaNombre || "Partida Contractual"}
                </div>
                {selectedElement.costoEstimado && (
                  <div className="text-emerald-700 font-mono font-bold text-[11px] pt-1">
                    Presupuesto Asignado: S/ {selectedElement.costoEstimado.toLocaleString("es-PE")}
                  </div>
                )}
              </div>

              {/* Quick Action: Report BCF Issue for this element */}
              <button
                type="button"
                onClick={() => {
                  setNewBcfTitle(`Observación sobre ${selectedElement.name}`);
                  setIsNewBcfModalOpen(true);
                }}
                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Crear Incidencia BCF en este Elemento</span>
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm text-center py-8 space-y-2">
              <Compass className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">Ningún elemento seleccionado</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Haz clic en cualquier viga, columna, zapata o losa del visor 3D para inspeccionar sus
                metrados y partidas 5D.
              </p>
            </div>
          )}

          {/* BCF Collaboration List Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-rose-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Colaboración BCF ({bcfIssues.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBcfModalOpen(true)}
                className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Nueva Incidencia</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {bcfIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      {issue.tipo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        issue.estado === "Subsanado / Aprobado"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {issue.estado}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{issue.titulo}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{issue.descripcion}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                    <span>{issue.creadoPor}</span>
                    <span>{issue.fecha}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New BCF Modal */}
      {isNewBcfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Registrar Incidencia BCF / RFI
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBcfModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de la Incidencia *</label>
                <input
                  type="text"
                  value={newBcfTitle}
                  onChange={(e) => setNewBcfTitle(e.target.value)}
                  placeholder="e.g. Incompatibilidad de refuerzo en nudo viga-columna"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Incidencia</label>
                  <select
                    value={newBcfType}
                    onChange={(e) => setNewBcfType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Interferencia / Clash">Interferencia / Clash</option>
                    <option value="Observación de Residente">Observación de Residente</option>
                    <option value="Conformidad de Supervisor">Conformidad de Supervisor</option>
                    <option value="Consulta Técnica RFI">Consulta Técnica RFI</option>
                    <option value="Alerta de Calidad / Seguridad">Alerta de Calidad / Seguridad</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={newBcfPriority}
                    onChange={(e) => setNewBcfPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción Detallada</label>
                <textarea
                  rows={3}
                  value={newBcfDesc}
                  onChange={(e) => setNewBcfDesc(e.target.value)}
                  placeholder="Detalla la observación técnica, eje estructural o recomendación de subsanación..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                <span>Registrado por: </span>
                <strong className="text-slate-700">{currentAuthorName}</strong> ({currentAuthorRole})
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewBcfModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddBcfIssue}
                disabled={!newBcfTitle.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                Guardar Incidencia BCF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

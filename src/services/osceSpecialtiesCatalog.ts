/**
 * Catálogo Oficial de Especialidades, Subespecialidades y Tipologías de Obras y Consultorías de Obra
 * Aprobado mediante RESOLUCIÓN DIRECTORAL N° 0016-2025-EF/54.01 (Publicado en El Peruano el 10 de mayo de 2025)
 * En el marco de la Ley N° 32069, Ley General de Contrataciones Públicas, y su Reglamento (D.S. N° 009-2025-EF, Art. 157)
 */

export interface TipologiaItem {
  nombre: string;
  esRural?: boolean;
}

export interface SubespecialidadItem {
  id: string;
  nombre: string;
  descripcion?: string;
  tipologias: string[];
}

export interface EspecialidadOficial {
  id: string;
  letra: "a" | "b" | "c" | "d" | "e";
  nombre: string;
  reglamentoRef: string;
  subespecialidades: SubespecialidadItem[];
}

export const CATALOGO_ESPECIALIDADES_RD_0016_2025: EspecialidadOficial[] = [
  {
    id: "edificaciones",
    letra: "a",
    nombre: "Edificaciones y Afines",
    reglamentoRef: "Art. 157.2 literal a) del D.S. N° 009-2025-EF",
    subespecialidades: [
      {
        id: "edif-admin",
        nombre: "Establecimientos administrativos o de atención al público",
        tipologias: [
          "Sedes institucionales, oficinas, dependencias, intendencias, sedes fiscales",
          "Viviendas, edificios, casas",
          "Archivos",
          "Almacenes",
          "Centros de atención al ciudadano",
          "Centro de desarrollo integral de las familias",
          "Centro integral de atención al adulto mayor",
          "Centros juveniles de diagnóstico y rehabilitación o de orientación al adolescente",
          "Centro de emergencia mujer",
          "Centros de acogida o atención residencial, hogares de refugio temporal",
          "Afines*",
        ],
      },
      {
        id: "edif-educ",
        nombre: "Edificación educativa",
        tipologias: [
          "Laboratorios de investigación",
          "Centros de ciencia, tecnología, innovación tecnológica o productiva y transferencia tecnológica",
          "Edificación para educación de alto desempeño",
          "Edificación para educación básica",
          "Edificación para educación superior",
          "Edificación para educación técnica",
          "Edificación para educación técnico-productiva",
          "Afines*",
        ],
      },
      {
        id: "edif-depor",
        nombre: "Establecimientos o espacios deportivos",
        tipologias: [
          "Instalaciones deportivas para alto rendimiento",
          "Estadios deportivos y coliseos",
          "Instalaciones deportivas recreativas",
          "Afines*",
        ],
      },
      {
        id: "edif-salud",
        nombre: "Establecimientos de salud",
        tipologias: [
          "Establecimiento de salud del primer nivel de atención",
          "Establecimiento de salud del segundo nivel de atención",
          "Establecimiento de salud del tercer nivel de atención",
          "Institutos de salud especializados",
          "Laboratorios de salud pública",
          "Centros dedicados al diagnóstico o recuperación de la salud, como odontológicos, de rehabilitación, de salud ocupacional, entre otros",
          "Afines*",
        ],
      },
      {
        id: "edif-segur",
        nombre: "Establecimientos de seguridad y vigilancia",
        tipologias: [
          "Compañía de Bomberos",
          "Comisarías",
          "Locales para serenazgo",
          "Unidades policiales especializadas, de investigación criminal o criminalística",
          "Unidades medicolegales",
          "Unidades militares de control, vigilancia y defensa del territorio",
          "Centros de especialización",
          "Afines*",
        ],
      },
      {
        id: "edif-penit",
        nombre: "Establecimientos penitenciarios",
        tipologias: [
          "Penales",
          "Penales de máxima seguridad",
          "Afines*",
        ],
      },
      {
        id: "edif-public",
        nombre: "Espacios públicos y recreacionales",
        tipologias: [
          "Mercados",
          "Bibliotecas públicas",
          "Parques, espacios públicos para esparcimiento y recreación",
          "Museos",
          "Cementerios",
          "Edificación cultural pública",
          "Edificaciones declaradas Patrimonio Cultural",
          "Afines*",
        ],
      },
      {
        id: "edif-ambient",
        nombre: "Edificaciones de gestión ambiental",
        tipologias: [
          "Plantas de tratamiento de residuos sólidos",
          "Redes de monitoreo ambiental",
          "Afines*",
        ],
      },
      {
        id: "edif-rural",
        nombre: "Obras rurales (Edificaciones)",
        tipologias: [
          "Establos",
          "Locales comunales",
          "Galpones",
          "Granjas",
          "Afines*",
        ],
      },
    ],
  },
  {
    id: "viales",
    letra: "b",
    nombre: "Viales, Puertos y Afines",
    reglamentoRef: "Art. 157.2 literal b) del D.S. N° 009-2025-EF",
    subespecialidades: [
      {
        id: "vial-obras",
        nombre: "Obras viales",
        tipologias: [
          "Carreteras nacionales, departamentales y provinciales",
          "Puentes",
          "Viaductos",
          "Intercambios viales a desnivel",
          "Túneles",
          "Afines*",
        ],
      },
      {
        id: "vial-urbanas",
        nombre: "Vías urbanas",
        tipologias: [
          "Vías expresas, arteriales, colectoras y locales",
          "Pistas, veredas, ciclovías, puentes peatonales, puentes vehiculares urbanos, pasajes peatonales y carreteras vecinales",
          "Vías de acceso",
          "Terminales terrestres",
          "Afines*",
        ],
      },
      {
        id: "vial-ferro",
        nombre: "Infraestructura ferroviaria",
        tipologias: [
          "Sistema ferroviario interurbano",
          "Sistema ferroviario interregional",
          "Afines*",
        ],
      },
      {
        id: "vial-aero",
        nombre: "Infraestructura aeroportuaria",
        tipologias: [
          "Aeropuertos según categoría",
          "Pistas de aterrizaje",
          "Aeródromos",
          "Afines*",
        ],
      },
      {
        id: "vial-port",
        nombre: "Infraestructura portuaria",
        tipologias: [
          "Embarcaderos fluviales y lacustres",
          "Puertos marítimos, fluviales y lacustres",
          "Terminales portuarios fluviales",
          "Afines*",
        ],
      },
      {
        id: "vial-pesq",
        nombre: "Infraestructura pesquera",
        tipologias: [
          "Desembarcadero pesquero",
          "Centro de entrenamiento pesquero, centro acuícola",
          "Afines*",
        ],
      },
      {
        id: "vial-transp",
        nombre: "Obras para transporte",
        tipologias: [
          "Teleféricos",
          "Afines*",
        ],
      },
      {
        id: "vial-rural",
        nombre: "Obras rurales (Viales / Puertos)",
        tipologias: [
          "Pavimentación de calles con adoquín o empedrado",
          "Caminos vecinales con una Intensidad Media Diaria (IMD) menor o igual a 50 vehículos/día",
          "Puentes con una longitud máxima de 10 metros",
          "Huaros",
          "Muelles",
          "Desembarcaderos artesanales",
          "Afines*",
        ],
      },
    ],
  },
  {
    id: "saneamiento",
    letra: "c",
    nombre: "Saneamiento y Afines",
    reglamentoRef: "Art. 157.2 literal c) del D.S. N° 009-2025-EF",
    subespecialidades: [
      {
        id: "san-agua",
        nombre: "Infraestructura para agua potable",
        tipologias: [
          "Infraestructura para fuentes de abastecimiento de agua: represa, canal de conducción y/o túnel de trasvase",
          "Infraestructura para sistemas de producción y de distribución: reservorios, redes de distribución de agua al usuario",
          "Afines*",
        ],
      },
      {
        id: "san-alcant",
        nombre: "Infraestructura para alcantarillado",
        tipologias: [
          "Infraestructura para sistemas de alcantarillado sanitario: redes de aguas residuales y/o estaciones de bombeo de aguas residuales",
          "Afines*",
        ],
      },
      {
        id: "san-ptar",
        nombre: "Infraestructura de tratamiento de aguas residuales y disposición final",
        tipologias: [
          "Infraestructura para sistemas de tratamiento de aguas residuales para su disposición final o reúso: plantas de tratamiento de aguas residuales (PTAR), lagunas de estabilización, sistemas de disposición final o reúso",
          "Afines*",
        ],
      },
      {
        id: "san-pluvial",
        nombre: "Infraestructura para drenaje pluvial",
        tipologias: [
          "Infraestructura para sistema de drenaje pluvial",
          "Afines*",
        ],
      },
      {
        id: "san-rural",
        nombre: "Obras rurales (Saneamiento)",
        tipologias: [
          "Tanques sépticos y/o pozos percoladores",
          "Afines*",
        ],
      },
    ],
  },
  {
    id: "electromecanica",
    letra: "d",
    nombre: "Electromecánicas, Energéticas, Telecomunicaciones y Afines",
    reglamentoRef: "Art. 157.2 literal d) del D.S. N° 009-2025-EF",
    subespecialidades: [
      {
        id: "elec-energia",
        nombre: "Infraestructura para energía eléctrica",
        tipologias: [
          "Líneas de trasmisión y subtransmisión de energía eléctrica",
          "Líneas y/o redes de distribución de energía eléctrica",
          "Subestación de transformación",
          "Centrales de generación de energía eléctrica",
          "Afines*",
        ],
      },
      {
        id: "elec-telecom",
        nombre: "Infraestructura para telecomunicaciones",
        tipologias: [
          "Sistemas de telecomunicaciones",
          "Afines*",
        ],
      },
      {
        id: "elec-hidrocarb",
        nombre: "Infraestructura para hidrocarburos",
        tipologias: [
          "Almacenamiento de hidrocarburos",
          "Refinerías",
          "Estaciones de abastecimiento de combustibles",
          "Gaseoductos y oleoducto",
          "Líneas y redes de conducción de combustibles, gases",
          "Afines*",
        ],
      },
    ],
  },
  {
    id: "represas",
    letra: "e",
    nombre: "Represas, Irrigaciones y Afines",
    reglamentoRef: "Art. 157.2 literal e) del D.S. N° 009-2025-EF",
    subespecialidades: [
      {
        id: "rep-represas",
        nombre: "Represas",
        tipologias: [
          "Represas para riego",
          "Afines*",
        ],
      },
      {
        id: "rep-riego",
        nombre: "Infraestructura para riego",
        tipologias: [
          "Estructuras de almacenamiento hídrico con fines de riego",
          "Captación de agua para riego",
          "Conducción y distribución de agua para riego",
          "Infraestructura de riego menor",
          "Obras de aprovechamiento de aguas subterráneas con fines de riego",
          "Afines*",
        ],
      },
      {
        id: "rep-encauza",
        nombre: "Infraestructura para encauzamiento",
        tipologias: [
          "Obras de encauzamiento de ríos, protección de quebradas",
          "Presas de laminación",
          "Defensas ribereñas",
          "Afines*",
        ],
      },
      {
        id: "rep-rural",
        nombre: "Obras rurales (Represas / Irrigación)",
        tipologias: [
          "Sistemas de riego tecnificado",
          "Pozos tubulares",
          "Afines*",
        ],
      },
    ],
  },
];

/**
 * Busca o sugiere la Especialidad, Subespecialidad y Tipología oficial
 * de acuerdo al texto del objeto de la contratación.
 */
export function buscarClasificacionOficial(texto: string): {
  especialidad: string;
  subEspecialidad: string;
  tipologia: string;
  reglamentoRef: string;
  coincidenciaExacta: boolean;
} {
  const t = texto.toLowerCase();

  // 1. Viales y urbanas
  if (t.includes("pista") || t.includes("vereda") || t.includes("urbana") || t.includes("transitabilidad") || t.includes("ciclovia") || t.includes("pasaje")) {
    return {
      especialidad: "Viales, Puertos y Afines",
      subEspecialidad: "Vías urbanas",
      tipologia: "Pistas, veredas, ciclovías, puentes peatonales, puentes vehiculares urbanos, pasajes peatonales y carreteras vecinales",
      reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 b) D.S. N° 009-2025-EF",
      coincidenciaExacta: true,
    };
  }

  if (t.includes("carretera") || t.includes("puente") || t.includes("viaducto") || t.includes("tunel") || t.includes("asfalt")) {
    return {
      especialidad: "Viales, Puertos y Afines",
      subEspecialidad: "Obras viales",
      tipologia: "Carreteras nacionales, departamentales y provinciales",
      reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 b) D.S. N° 009-2025-EF",
      coincidenciaExacta: true,
    };
  }

  // 2. Saneamiento
  if (t.includes("agua potable") || t.includes("reservorio") || t.includes("matriz") || t.includes("red de agua")) {
    return {
      especialidad: "Saneamiento y Afines",
      subEspecialidad: "Infraestructura para agua potable",
      tipologia: "Infraestructura para sistemas de producción y de distribución: reservorios, redes de distribución de agua al usuario",
      reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 c) D.S. N° 009-2025-EF",
      coincidenciaExacta: true,
    };
  }

  if (t.includes("alcantarillado") || t.includes("desague") || t.includes("colector") || t.includes("ptar") || t.includes("residual")) {
    return {
      especialidad: "Saneamiento y Afines",
      subEspecialidad: "Infraestructura para alcantarillado",
      tipologia: "Infraestructura para sistemas de alcantarillado sanitario: redes de aguas residuales y/o estaciones de bombeo de aguas residuales",
      reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 c) D.S. N° 009-2025-EF",
      coincidenciaExacta: true,
    };
  }

  if (t.includes("drenaje") || t.includes("pluvial")) {
    return {
      especialidad: "Saneamiento y Afines",
      subEspecialidad: "Infraestructura para drenaje pluvial",
      tipologia: "Infraestructura para sistema de drenaje pluvial",
      reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 c) D.S. N° 009-2025-EF",
      coincidenciaExacta: true,
    };
  }

  // 3. Edificaciones
  if (t.includes("colegio") || t.includes("educat") || t.includes("escuela") || t.includes("aula") || t.includes("i.e.") || t.includes("universidad")) {
    return {
      especialidad: "Edificaciones y Afines",
      subEspecialidad: "Edificación educativa",
      tipologia: "Edificación para educación básica",
      reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 a) D.S. N° 009-2025-EF",
      coincidenciaExacta: true,
    };
  }

  if (t.includes("hospital") || t.includes("salud") || t.includes("posta") || t.includes("centro de salud") || t.includes("clinica")) {
    return {
      especialidad: "Edificaciones y Afines",
      subEspecialidad: "Establecimientos de salud",
      tipologia: "Establecimiento de salud del primer nivel de atención",
      reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 a) D.S. N° 009-2025-EF",
      coincidenciaExacta: true,
    };
  }

  if (t.includes("palacio") || t.includes("sede") || t.includes("instituc") || t.includes("municipal") || t.includes("oficina")) {
    return {
      especialidad: "Edificaciones y Afines",
      subEspecialidad: "Establecimientos administrativos o de atención al público",
      tipologia: "Sedes institucionales, oficinas, dependencias, intendencias, sedes fiscales",
      reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 a) D.S. N° 009-2025-EF",
      coincidenciaExacta: true,
    };
  }

  // 4. Electromecánica & Energía
  if (t.includes("electrif") || t.includes("energia") || t.includes("subestacion") || t.includes("linea de transmision") || t.includes("red primaria")) {
    return {
      especialidad: "Electromecánicas, Energéticas, Telecomunicaciones y Afines",
      subEspecialidad: "Infraestructura para energía eléctrica",
      tipologia: "Líneas y/o redes de distribución de energía eléctrica",
      reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 d) D.S. N° 009-2025-EF",
      coincidenciaExacta: true,
    };
  }

  // 5. Represas & Riego
  if (t.includes("riego") || t.includes("canal") || t.includes("represa") || t.includes("defensa riberena") || t.includes("quebrada")) {
    return {
      especialidad: "Represas, Irrigaciones y Afines",
      subEspecialidad: "Infraestructura para riego",
      tipologia: "Conducción y distribución de agua para riego",
      reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 e) D.S. N° 009-2025-EF",
      coincidenciaExacta: true,
    };
  }

  // Default fallback
  return {
    especialidad: "Viales, Puertos y Afines",
    subEspecialidad: "Vías urbanas",
    tipologia: "Pistas, veredas, ciclovías, puentes peatonales, puentes vehiculares urbanos, pasajes peatonales y carreteras vecinales",
    reglamentoRef: "RD N° 0016-2025-EF/54.01 - Art. 157.2 b) D.S. N° 009-2025-EF",
    coincidenciaExacta: false,
  };
}

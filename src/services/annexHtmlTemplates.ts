import {
  TenderInfo,
  CompanyProfile,
  KeyPersonnel,
  EquipmentItem,
  ExperienceRecord,
  ObservationItem,
  ConsorcioMember,
} from "../types/osce";
import { formatPEN, numeroALetras } from "./docxGenerator";

export function getContratoConsorcioHtml(tender: TenderInfo, company: CompanyProfile): string {
  const member1: ConsorcioMember = company.integrantesConsorcio?.[0] || {
    id: "m1",
    razonSocial: company.razonSocial || "EMPRESA CONSORCIADA 1 S.A.C.",
    ruc: company.ruc || "20542350033",
    porcentajeParticipacion: 95,
    obligaciones: "Ejecución integral de las partidas operativas, aporte de experiencia técnica en la especialidad, dirección técnica y administración financiera.",
    representante: company.representanteLegal || "Henry Omar Marrufo Delgado",
    dni: company.dniRepresentante || "43900892",
    cargoRepresentante: "Gerente General",
    domicilioFiscal: company.domicilioFiscal || "Jr. Colón N° 958, Rioja, San Martín",
    partidaRegistralSunarp: company.partidaRegistralSunarp || "11052546",
    asientoRegistral: company.asientoRegistral || "C00003",
    sedeRegistral: company.sedeRegistral || "Oficina Registral de Moyobamba",
    registroRNP: company.registroRNP || "Ejecutor de Obras",
    esMype: true,
  };

  const member2: ConsorcioMember = company.integrantesConsorcio?.[1] || {
    id: "m2",
    razonSocial: "EMPRESA CONSORCIADA 2 E.I.R.L.",
    ruc: "20601280834",
    porcentajeParticipacion: 5,
    obligaciones: "Elaboración y formulación de la oferta técnica y económica, recopilación y presentación del plantel profesional clave y equipamiento estratégico.",
    representante: "Jhonny Reategui Alegría",
    dni: "43500740",
    cargoRepresentante: "Gerente General",
    domicilioFiscal: "Julio C. Arana N° 312, Rioja, San Martín",
    partidaRegistralSunarp: "11084474",
    asientoRegistral: "C00002",
    sedeRegistral: "Oficina Registral de Tarapoto",
    registroRNP: "Ejecutor de Obras",
    esMype: true,
  };

  const nombreConsorcio = (company.nombreConsorcio || "CONSORCIO VIAL NORTE").toUpperCase();
  const repComun = company.representanteComunConsorcio || member1.representante;
  const dniComun = company.dniRepresentanteComun || member1.dni;
  const repAlterno = company.representanteAlternoConsorcio || member2.representante;
  const dniAlterno = company.dniRepresentanteAlterno || member2.dni;
  const domComun = company.domicilioComunConsorcio || member1.domicilioFiscal;
  const emailComun = company.emailComunConsorcio || "consorciovialnorte.seace@gmail.com";
  const opTributario = company.operadorTributario || member1.razonSocial;
  const ciudadFirma = company.ciudadFirmaContrato || "Rioja";
  const fechaFirma = company.fechaFirmaContrato || new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
  const centroArbitraje = company.centroArbitraje || "Centro de Arbitraje de la Pontificia Universidad Católica del Perú (PUCP) / OSCE";

  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="font-size: 14pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f2942;">
        CONTRATO PRIVADO DE CONSORCIO CON FIRMAS LEGALIZADAS NOTARIALMENTE
      </h2>
      <p style="font-size: 11pt; font-weight: bold; color: #2563eb; margin: 4px 0 0 0; text-transform: uppercase;">
        ${nombreConsorcio}
      </p>
      <p style="font-size: 9pt; color: #64748b; margin: 2px 0 0 0;">
        Procedimiento: <strong>${tender.nomenclatura}</strong> • ${tender.entidadConvocante}
      </p>
    </div>

    <p style="text-align: justify; margin-bottom: 12px;">
      Conste por el presente documento privado de <strong>CONTRATO DE CONSORCIO</strong>, que celebran de conformidad con lo establecido en el <strong>Artículo 13 de la Ley de Contrataciones del Estado (Ley N° 30225 / Ley N° 32069)</strong>, su Reglamento aprobado mediante D.S. N° 344-2018-EF / D.S. N° 009-2025-EF, y supletoriamente por los <strong>Artículos 445° al 448° de la Ley General de Sociedades (Ley N° 26887)</strong>:
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 12px; margin-bottom: 14px;">
      <p style="margin: 0 0 8px 0; text-align: justify;">
        <strong>1. ${member1.razonSocial}</strong>, con <strong>RUC N° ${member1.ruc}</strong>, inscrita en la Partida Electrónica N° <strong>${member1.partidaRegistralSunarp || "11052546"}</strong>, Asiento ${member1.asientoRegistral || "C00003"} del Registro de Personas Jurídicas de la <strong>${member1.sedeRegistral || "SUNARP"}</strong>, con domicilio legal en ${member1.domicilioFiscal}, debidamente representada por su ${member1.cargoRepresentante || "Gerente General"}, don(ña) <strong>${member1.representante}</strong>, identificado(a) con <strong>DNI N° ${member1.dni}</strong>.
      </p>
      <p style="margin: 8px 0 0 0; border-top: 1px solid #e2e8f0; padding-top: 8px; text-align: justify;">
        <strong>2. ${member2.razonSocial}</strong>, con <strong>RUC N° ${member2.ruc}</strong>, inscrita en la Partida Electrónica N° <strong>${member2.partidaRegistralSunarp || "11084474"}</strong>, Asiento ${member2.asientoRegistral || "C00002"} del Registro de Personas Jurídicas de la <strong>${member2.sedeRegistral || "SUNARP"}</strong>, con domicilio legal en ${member2.domicilioFiscal}, debidamente representada por su ${member2.cargoRepresentante || "Gerente General"}, don(ña) <strong>${member2.representante}</strong>, identificado(a) con <strong>DNI N° ${member2.dni}</strong>.
      </p>
    </div>

    <p style="text-align: justify; margin-bottom: 10px;">
      <strong>CLÁUSULA PRIMERA: DE LAS PARTES Y MARCO LEGAL.-</strong> Las partes declaran ser empresas formalmente constituidas e inscritas en el Registro Nacional de Proveedores (RNP) del OSCE como ${member1.registroRNP || "Ejecutores de Obras"}.
    </p>

    <p style="text-align: justify; margin-bottom: 10px;">
      <strong>CLÁUSULA SEGUNDA: DEL OBJETO DEL CONSORCIO.-</strong> El presente Consorcio tiene por objeto exclusivo la participación conjunta en el procedimiento de selección <strong>${tender.nomenclatura}</strong>, convocado por <strong>${tender.entidadConvocante}</strong>, para la ejecución de: <em>"${tender.descripcionObjeto || tender.objetoContratacion}"</em>.
    </p>

    <p style="text-align: justify; margin-bottom: 10px;">
      <strong>CLÁUSULA TERCERA: DENOMINACIÓN Y DOMICILIO COMÚN.-</strong> El Consorcio actuará bajo la denominación de <strong>"${nombreConsorcio}"</strong>, fijando su domicilio común en <strong>${domComun}</strong> y correo electrónico oficial <strong>${emailComun}</strong> para todas las notificaciones formales del SEACE.
    </p>

    <p style="text-align: justify; margin-bottom: 10px;">
      <strong>CLÁUSULA CUARTA: DURACIÓN DEL CONSORCIO.-</strong> El plazo de vigencia del Consorcio se inicia con la suscripción del presente documento y regirá hasta la total culminación, recepción, liquidación y pago final del contrato de obra y de sus controversias si las hubiere.
    </p>

    <div style="margin-bottom: 12px;">
      <p style="margin-bottom: 6px;"><strong>CLÁUSULA QUINTA: PORCENTAJE DE PARTICIPACIÓN Y OBLIGACIONES ASUMIDAS.-</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9.5pt;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left;">
            <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 35%;">Empresa Integrante</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 15%; text-align: center;">% Part.</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 50%;">Obligaciones Asumidas</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">${member1.razonSocial}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold; color: #1e3a8a;">${member1.porcentajeParticipacion}%</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${member1.obligaciones}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">${member2.razonSocial}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold; color: #1e3a8a;">${member2.porcentajeParticipacion}%</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${member2.obligaciones}</td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">TOTAL CONSOLIDADO</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; color: #047857;">${(Number(member1.porcentajeParticipacion) + Number(member2.porcentajeParticipacion)).toFixed(2)}%</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; color: #64748b; font-size: 8.5pt;">Conforme a Directiva N° 005-2019-OSCE/CD</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style="text-align: justify; margin-bottom: 10px;">
      <strong>CLÁUSULA SEXTA: DESIGNACIÓN DEL OPERADOR TRIBUTARIO.-</strong> Se designa a <strong>${opTributario}</strong> como OPERADOR TRIBUTARIO facultado para centralizar la emisión de facturas electrónicas, apertura de cuenta corriente bancaria mancomunada y obligaciones tributarias ante la SUNAT.
    </p>

    <p style="text-align: justify; margin-bottom: 10px;">
      <strong>CLÁUSULA SÉPTIMA: RESPONSABILIDAD SOLIDARIA E INDIVISIBLE.-</strong> Los consorciados asumen responsabilidad solidaria e indivisible frente a la Entidad y terceros por el fiel cumplimiento de todas las obligaciones técnicas, económicas y legales del contrato.
    </p>

    <p style="text-align: justify; margin-bottom: 10px;">
      <strong>CLÁUSULA OCTAVA: REPRESENTANTE LEGAL COMÚN Y PODERES NOTARIALES.-</strong> Se confiere poder amplio a don(ña) <strong>${repComun}</strong> (DNI N° <strong>${dniComun}</strong>) como Representante Legal Común y como Alterno a don(ña) <strong>${repAlterno}</strong> (DNI N° <strong>${dniAlterno}</strong>), confiriéndoles las 11 facultades notariales plenas para representación ante OSCE, suscripción de contrato, trámite de valorizaciones, adicionales, ampliaciones de plazo, cobranzas y liquidación final.
    </p>

    <p style="text-align: justify; margin-bottom: 12px;">
      <strong>CLÁUSULA NOVENA: SOLUCIÓN DE CONTROVERSIAS Y ARBITRAJE.-</strong> Toda discrepancia derivada del presente contrato o de la ejecución de obra será sometida a arbitraje institucional administrado por: <strong>${centroArbitraje}</strong>.
    </p>

    <p style="text-align: justify; margin-bottom: 24px;">
      En señal de plena conformidad con todas las cláusulas precedentes, las partes suscriben el presente contrato en la ciudad de <strong>${ciudadFirma}</strong>, el <strong>${fechaFirma}</strong>, procediendo a la correspondiente legalización notarial de firmas.
    </p>

    <div style="display: flex; justify-content: space-around; text-align: center; margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 20px;">
      <div style="width: 45%;">
        <div style="border-top: 1px solid #475569; width: 80%; margin: 0 auto 6px auto;"></div>
        <p style="margin: 0; font-weight: bold; font-size: 10pt;">${member1.representante}</p>
        <p style="margin: 2px 0; font-size: 8.5pt; color: #475569;">DNI N° ${member1.dni} • ${member1.cargoRepresentante || "Gerente General"}</p>
        <p style="margin: 0; font-size: 8.5pt; font-weight: bold; color: #1e293b;">${member1.razonSocial}</p>
        <p style="margin: 2px 0 0 0; font-size: 7.5pt; color: #64748b; background-color: #f1f5f9; display: inline-block; padding: 2px 6px; border-radius: 4px;">Firma Legalizada Notarialmente</p>
      </div>

      <div style="width: 45%;">
        <div style="border-top: 1px solid #475569; width: 80%; margin: 0 auto 6px auto;"></div>
        <p style="margin: 0; font-weight: bold; font-size: 10pt;">${member2.representante}</p>
        <p style="margin: 2px 0; font-size: 8.5pt; color: #475569;">DNI N° ${member2.dni} • ${member2.cargoRepresentante || "Gerente General"}</p>
        <p style="margin: 0; font-size: 8.5pt; font-weight: bold; color: #1e293b;">${member2.razonSocial}</p>
        <p style="margin: 2px 0 0 0; font-size: 7.5pt; color: #64748b; background-color: #f1f5f9; display: inline-block; padding: 2px 6px; border-radius: 4px;">Firma Legalizada Notarialmente</p>
      </div>
    </div>
  `;
}

export function getAnexo5PromesaConsorcioHtml(tender: TenderInfo, company: CompanyProfile): string {
  const member1: ConsorcioMember = company.integrantesConsorcio?.[0] || {
    id: "m1",
    razonSocial: company.razonSocial || "EMPRESA CONSORCIADA 1 S.A.C.",
    ruc: company.ruc || "20542350033",
    porcentajeParticipacion: 95,
    obligaciones: "Ejecución integral de las partidas operativas, aporte de experiencia técnica en la especialidad, dirección técnica y administración financiera.",
    representante: company.representanteLegal || "Henry Omar Marrufo Delgado",
    dni: company.dniRepresentante || "43900892",
    domicilioFiscal: company.domicilioFiscal || "Jr. Colón N° 958, Rioja, San Martín",
    registroRNP: company.registroRNP || "Ejecutor de Obras",
  };

  const member2: ConsorcioMember = company.integrantesConsorcio?.[1] || {
    id: "m2",
    razonSocial: "EMPRESA CONSORCIADA 2 E.I.R.L.",
    ruc: "20601280834",
    porcentajeParticipacion: 5,
    obligaciones: "Elaboración y formulación de la oferta técnica y económica, recopilación y presentación del plantel profesional clave y equipamiento estratégico.",
    representante: "Jhonny Reategui Alegría",
    dni: "43500740",
    domicilioFiscal: "Julio C. Arana N° 312, Rioja, San Martín",
    registroRNP: "Ejecutor de Obras",
  };

  const nombreConsorcio = (company.nombreConsorcio || "CONSORCIO VIAL NORTE").toUpperCase();
  const repComun = company.representanteComunConsorcio || member1.representante;
  const dniComun = company.dniRepresentanteComun || member1.dni;
  const domComun = company.domicilioComunConsorcio || member1.domicilioFiscal;
  const emailComun = company.emailComunConsorcio || "consorciovialnorte.seace@gmail.com";
  const totalPerc = (Number(member1.porcentajeParticipacion) + Number(member2.porcentajeParticipacion)).toFixed(2);

  return `
    <div style="text-align: center; margin-bottom: 18px;">
      <h2 style="font-size: 13pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f2942;">
        ANEXO N° 5: PROMESA FORMAL DE CONSORCIO
      </h2>
      <p style="font-size: 9.5pt; font-style: italic; color: #475569; margin: 3px 0 0 0;">
        (Directiva N° 005-2019-OSCE/CD • Ley N° 32069 • Con Firmas Legalizadas Notarialmente)
      </p>
    </div>

    <div style="margin-bottom: 14px; line-height: 1.4;">
      <p style="margin: 0; font-weight: bold;">Señores</p>
      <p style="margin: 0; font-weight: bold;">COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES</p>
      <p style="margin: 0; color: #1e293b;">${tender.entidadConvocante}</p>
      <p style="margin: 0;">Presente.-</p>
    </div>

    <div style="margin-bottom: 12px;">
      <p style="margin: 0 0 4px 0;"><strong>Referencia:</strong> ${tender.nomenclatura}</p>
      <p style="margin: 0 0 8px 0;"><strong>Objeto:</strong> ${tender.descripcionObjeto || tender.objetoContratacion}</p>
    </div>

    <p style="text-align: justify; margin-bottom: 12px;">
      Los suscritos declaramos bajo juramento nuestra formal e irrevocable promesa de constituir el consorcio <strong>"${nombreConsorcio}"</strong> para participar en el procedimiento de selección <strong>${tender.nomenclatura}</strong>, y en caso de resultar favorecidos con la Buena Pro, formalizar el contrato correspondiente, asumiendo responsabilidad solidaria e indivisible por todas y cada una de las obligaciones derivadas de nuestra oferta y de la ejecución contractual:
    </p>

    <div style="margin-bottom: 14px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left;">
            <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 32%;">INTEGRANTE DEL CONSORCIO</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 14%; text-align: center;">% PART.</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 54%;">OBLIGACIONES ASUMIDAS EN EL CONTRATO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">
              <strong>${member1.razonSocial}</strong><br />
              <span style="font-size: 8.5pt; color: #475569;">RUC N° ${member1.ruc} • Rep: ${member1.representante} (DNI ${member1.dni})</span>
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold; color: #1e3a8a;">
              ${member1.porcentajeParticipacion}%
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">
              ${member1.obligaciones}
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">
              <strong>${member2.razonSocial}</strong><br />
              <span style="font-size: 8.5pt; color: #475569;">RUC N° ${member2.ruc} • Rep: ${member2.representante} (DNI ${member2.dni})</span>
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold; color: #1e3a8a;">
              ${member2.porcentajeParticipacion}%
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">
              ${member2.obligaciones}
            </td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">TOTAL CONSOLIDADO</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; color: #047857;">
              ${totalPerc}%
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 8.5pt; color: #64748b;">
              100.00% Consolidado Conforme a Directiva N° 005-2019-OSCE/CD
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style="text-align: justify; margin-bottom: 12px;">
      Designamos como <strong>Representante Común del Consorcio</strong> a don(ña) <strong>${repComun}</strong>, identificado(a) con <strong>DNI N° ${dniComun}</strong>, fijando domicilio común en <strong>${domComun}</strong> y correo electrónico oficial para notificaciones del SEACE en <strong>${emailComun}</strong>.
    </p>

    <p style="text-align: justify; margin-bottom: 24px;">
      Asimismo, declaramos bajo juramento que ninguno de los integrantes del consorcio tiene impedimento para postular y contratar con el Estado de conformidad con el Artículo 11 de la Ley de Contrataciones.
    </p>

    <div style="display: flex; justify-content: space-around; text-align: center; margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 20px;">
      <div style="width: 45%;">
        <div style="border-top: 1px solid #475569; width: 80%; margin: 0 auto 6px auto;"></div>
        <p style="margin: 0; font-weight: bold; font-size: 10pt;">${member1.representante}</p>
        <p style="margin: 2px 0; font-size: 8.5pt; color: #475569;">DNI N° ${member1.dni}</p>
        <p style="margin: 0; font-size: 8.5pt; font-weight: bold; color: #1e293b;">${member1.razonSocial}</p>
        <p style="margin: 2px 0 0 0; font-size: 7.5pt; color: #64748b; background-color: #f1f5f9; display: inline-block; padding: 2px 6px; border-radius: 4px;">Firma Legalizada Notarialmente</p>
      </div>

      <div style="width: 45%;">
        <div style="border-top: 1px solid #475569; width: 80%; margin: 0 auto 6px auto;"></div>
        <p style="margin: 0; font-weight: bold; font-size: 10pt;">${member2.representante}</p>
        <p style="margin: 2px 0; font-size: 8.5pt; color: #475569;">DNI N° ${member2.dni}</p>
        <p style="margin: 0; font-size: 8.5pt; font-weight: bold; color: #1e293b;">${member2.razonSocial}</p>
        <p style="margin: 2px 0 0 0; font-size: 7.5pt; color: #64748b; background-color: #f1f5f9; display: inline-block; padding: 2px 6px; border-radius: 4px;">Firma Legalizada Notarialmente</p>
      </div>
    </div>
  `;
}

export function getGeneralAnnexHtml(
  annexId: string,
  annexTitle: string,
  tender: TenderInfo,
  company: CompanyProfile,
  extraParams?: {
    montoOfertado?: number;
    incluyeIGV?: boolean;
    personal?: KeyPersonnel[];
    equipment?: EquipmentItem[];
    experience?: ExperienceRecord[];
    observations?: ObservationItem[];
    customText?: string;
  }
): string {
  if (annexId === "anexo5") {
    return getAnexo5PromesaConsorcioHtml(tender, company);
  }
  if (annexId === "contratoConsorcio") {
    return getContratoConsorcioHtml(tender, company);
  }

  const header = `
    <div style="text-align: center; margin-bottom: 18px;">
      <h2 style="font-size: 13pt; font-weight: bold; margin: 0; text-transform: uppercase; color: #0f2942;">
        ${annexTitle}
      </h2>
      <p style="font-size: 9.5pt; font-style: italic; color: #475569; margin: 3px 0 0 0;">
        (Conforme a la Ley N° 32069, D.S. N° 009-2025-EF y Bases Estándar OSCE)
      </p>
    </div>

    <div style="margin-bottom: 14px; line-height: 1.4;">
      <p style="margin: 0; font-weight: bold;">Señores</p>
      <p style="margin: 0; font-weight: bold;">COMITÉ DE SELECCIÓN / ÓRGANO ENCARGADO DE LAS CONTRATACIONES</p>
      <p style="margin: 0; color: #1e293b;">${tender.entidadConvocante}</p>
      <p style="margin: 0;">Presente.-</p>
    </div>

    <div style="margin-bottom: 12px;">
      <p style="margin: 0 0 4px 0;"><strong>Referencia:</strong> ${tender.nomenclatura}</p>
      <p style="margin: 0 0 8px 0;"><strong>Objeto:</strong> ${tender.descripcionObjeto || tender.objetoContratacion}</p>
    </div>

    <p style="text-align: justify; margin-bottom: 12px;">
      El que suscribe, <strong>${company.representanteLegal}</strong>, identificado con DNI N° <strong>${company.dniRepresentante}</strong>, en calidad de Representante Legal de la empresa <strong>${company.razonSocial}</strong>, con RUC N° <strong>${company.ruc}</strong>, declara bajo juramento:
    </p>
  `;

  let body = "";

  if (annexId === "anexo1") {
    body = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 14px;">
        <tbody>
          <tr style="background-color: #f8fafc;">
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold; width: 35%;">Razón Social:</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 65%;">${company.razonSocial}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">Número de RUC:</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-family: monospace;">${company.ruc}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">Registro RNP:</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; color: #1e3a8a; font-weight: bold;">VIGENTE (${company.registroRNP})</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">Domicilio Fiscal:</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${company.domicilioFiscal} - ${company.distrito}, ${company.provincia}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">Correo Electrónico Notificación:</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${company.email}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">Teléfono / Celular:</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${company.telefono}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">Cuenta Bancaria / CCI:</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${company.banco} | CCI: ${company.cuentaCCI}</td>
          </tr>
        </tbody>
      </table>
    `;
  } else if (annexId === "anexo2") {
    body = `
      <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 4px; padding: 12px; margin-bottom: 14px;">
        <p style="margin: 0; font-weight: bold; color: #166534;">
          DECLARACIÓN JURADA DE CUMPLIMIENTO DE TÉRMINOS DE REFERENCIA Y ESPECIFICACIONES TÉCNICAS
        </p>
        <p style="margin: 6px 0 0 0; text-align: justify; font-size: 9.5pt;">
          Declaramos bajo juramento que nuestra oferta cumple cabal y estrictamente con todos y cada uno de los Términos de Referencia, Especificaciones Técnicas, Planos, Metrados y condiciones contractuales establecidas en el Capítulo III de las Bases del procedimiento ${tender.nomenclatura}.
        </p>
      </div>
      ${
        extraParams?.customText
          ? `<div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; margin-top: 10px;">${extraParams.customText}</div>`
          : ""
      }
    `;
  } else if (annexId === "anexo3") {
    body = `
      <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 14px;">
        <p style="margin: 0; font-size: 11pt; font-weight: bold; color: #1e3a8a; text-transform: uppercase;">
          PLAZO OFERTADO: ${tender.plazoEjecucion.toUpperCase()}
        </p>
        <p style="margin: 6px 0 0 0; font-size: 9pt; color: #64748b; font-style: italic;">
          En estricta concordancia con el plazo requerido en las Bases Administrativas
        </p>
      </div>
    `;
  } else if (annexId === "anexo4") {
    body = `
      <ul style="line-height: 1.6; margin-bottom: 14px; padding-left: 20px;">
        <li>No haber incurrido y obligarse a no incurrir en actos de corrupción, soborno o extorsión (Principio de Integridad).</li>
        <li>No tener impedimento para postular en el procedimiento de selección ni para contratar con el Estado, conforme al Artículo 11 de la Ley.</li>
        <li>Conocer, aceptar y someterse a las Bases, condiciones y reglas del procedimiento de selección.</li>
        <li>Ser responsable de la veracidad de los documentos e información que presenta para efectos del procedimiento.</li>
        <li>Conocer las sanciones aplicables por el Tribunal de Contrataciones del Estado (TCE) ante infracciones.</li>
      </ul>
    `;
  } else if (annexId === "anexo6") {
    const monto = extraParams?.montoOfertado || 0;
    const conIGV = extraParams?.incluyeIGV !== false;
    const subtotal = conIGV ? monto / 1.18 : monto;
    const igv = conIGV ? monto - subtotal : 0;

    body = `
      <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 14px;">
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">Subtotal / Valor Venta:</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-family: monospace;">${formatPEN(subtotal)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold;">${conIGV ? "IGV (18%):" : "IGV Exonerado:"}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-family: monospace;">${formatPEN(igv)}</td>
          </tr>
          <tr style="background-color: #eff6ff; font-weight: bold;">
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; color: #1e3a8a; font-size: 10.5pt;">MONTO TOTAL OFERTADO:</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-family: monospace; color: #1e3a8a; font-size: 11pt;">${formatPEN(monto)}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin: 8px 0 14px 0; font-size: 9.5pt;">
        <strong>SON:</strong> ${numeroALetras(monto)}
      </p>
    `;
  }

  const footer = `
    <div style="text-align: center; margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 20px;">
      <div style="border-top: 1px solid #475569; width: 50%; margin: 0 auto 6px auto;"></div>
      <p style="margin: 0; font-weight: bold; font-size: 10pt;">${company.representanteLegal}</p>
      <p style="margin: 2px 0; font-size: 8.5pt; color: #475569;">DNI N° ${company.dniRepresentante} - Representante Legal</p>
      <p style="margin: 0; font-size: 8.5pt; font-weight: bold; color: #1e293b;">${company.razonSocial}</p>
      <p style="margin: 2px 0 0 0; font-size: 7.5pt; color: #64748b;">RUC N° ${company.ruc}</p>
    </div>
  `;

  return header + body + footer;
}

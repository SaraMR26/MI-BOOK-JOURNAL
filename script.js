// ==========================================
// BASE DE DATOS LOCAL Y ESTADO GLOBAL
// ==========================================
let libros = JSON.parse(localStorage.getItem("libros")) || [];
let citas = JSON.parse(localStorage.getItem("citas")) || [];
let adaptaciones = JSON.parse(localStorage.getItem("adaptaciones")) || [];
let habitTrackerData = JSON.parse(localStorage.getItem("habitTrackerData")) || {};
let metas = JSON.parse(localStorage.getItem("metas")) || [
    { id: 1, titulo: "Leer 20 libros en el año", objetivo: 20, actual: 0, completada: false },
    { id: 2, titulo: "Leer al menos 5,000 páginas", objetivo: 5000, actual: 0, completada: false },
    { id: 3, titulo: "Explorar un nuevo género literario", objetivo: 1, actual: 0, completada: false }
];

let anioSeleccionado = 2026;
let paginaActualCitas = 1;
const citasPorPagina = 10;

// Guardar en LocalStorage
function guardarEnLocalStorage() {
    localStorage.setItem("libros", JSON.stringify(libros));
    localStorage.setItem("citas", JSON.stringify(citas));
    localStorage.setItem("adaptaciones", JSON.stringify(adaptaciones));
    localStorage.setItem("habitTrackerData", JSON.stringify(habitTrackerData));
    localStorage.setItem("metas", JSON.stringify(metas));
}

// ==========================================
// FUNCIONES DE UTILIDAD Y FORMATO
// ==========================================
function generarEstrellas(rating, inactivo = false) {
    let s = "";
    const num = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
        s += i <= num ? "★" : "☆";
    }
    const colorEstilo = inactivo ? "color: #e53e3e !important;" : "color: #f39c12 !important;";
    return `<span style="${colorEstilo} font-size:18px;">${s}</span>`;
}

function normalizarClase(t) {
    return t ? t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-") : "";
}

function calcularDiasLectura(inicioStr, finalStr) {
    if (!inicioStr || !finalStr || inicioStr === "Desconocida" || finalStr === "Desconocida") return "---";
    const parseFecha = (str) => {
        const s = str.trim();
        let partes = s.split('/');
        if (partes.length === 3) return new Date(partes[2], partes[1] - 1, partes[0]);
        partes = s.split('-');
        if (partes.length === 3) return new Date(partes[0], partes[1] - 1, partes[2]);
        return null;
    };
    const f1 = parseFecha(inicioStr);
    const f2 = parseFecha(finalStr);
    if (!f1 || !f2 || isNaN(f1) || isNaN(f2)) return "---";
    const diffTime = Math.abs(f2 - f1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays + 1} días`;
}

function obtenerSelectorAniosHTML(funcionCallback) {
    let aniosSet = new Set([2026, 2025, 2024, 2023, 2022, 2021]);
    libros.forEach(l => { if (l.anio) aniosSet.add(Number(l.anio)); });
    let aniosOrdenados = Array.from(aniosSet).sort((a, b) => b - a);

    let html = `<div class="selector-anio">`;
    aniosOrdenados.forEach(a => {
        html += `<button class="btn-anio ${anioSeleccionado === a ? 'activo' : ''}" onclick="${funcionCallback}(${a})">${a}</button>`;
    });
    html += `</div>`;
    return html;
}

function cambiarAnioGlobal(nuevoAnio, vista = 'libreria') {
    anioSeleccionado = Number(nuevoAnio);
    mostrarPagina(vista);
}

// ==========================================
// PARSER CSV MULTILÍNEA ROBUSTO
// ==========================================
function parseCSVMultilinea(textoCompleto) {
    const filas = [];
    let filaActual = [];
    let campoActual = "";
    let dentroDeComillas = false;

    for (let i = 0; i < textoCompleto.length; i++) {
        const char = textoCompleto[i];
        const siguienteChar = textoCompleto[i + 1];

        if (char === '"') {
            if (dentroDeComillas && siguienteChar === '"') {
                campoActual += '"';
                i++; // Saltar la siguiente comilla escapada
            } else {
                dentroDeComillas = !dentroDeComillas;
            }
        } else if (char === ',' && !dentroDeComillas) {
            filaActual.push(campoActual.trim());
            campoActual = "";
        } else if ((char === '\r' || char === '\n') && !dentroDeComillas) {
            if (char === '\r' && siguienteChar === '\n') { i++; }
            filaActual.push(campoActual.trim());
            if (filaActual.length > 1 || filaActual[0] !== "") {
                filas.push(filaActual);
            }
            filaActual = [];
            campoActual = "";
        } else {
            campoActual += char;
        }
    }
    if (campoActual !== "" || filaActual.length > 0) {
        filaActual.push(campoActual.trim());
        filas.push(filaActual);
    }
    return filas;
}

// Importar Reseñas desde CSV (Estructura de RESEÑA.txt)
function importarResenasCSV(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(e) {
        const textoCompleto = e.target.result;
        const filas = parseCSVMultilinea(textoCompleto);

        let count = 0;
        const inicioIndex = (filas.length > 0 && (filas[0][0].toLowerCase().includes("estado") || filas[0][0].toLowerCase().includes("titulo"))) ? 1 : 0;

        for (let i = inicioIndex; i < filas.length; i++) {
            const c = filas[i];
            if (c.length >= 2 && (c[0] || c[1])) {
                // Mapeo según la estructura: estado,titulo,autor,inicio,final,rating,personaje1,personaje2,trope,idioma,formato,paginas_saga,portada,sinopsis,notes
                const calificacionEstrellas = (c[5] || "").match(/★/g)?.length || (Number(c[5]) || 0);

                // Determinar el año a partir de las fechas
                let anioDet = 2026;
                const fechaRef = c[4] || c[3];
                if (fechaRef && fechaRef.trim() !== "" && fechaRef !== "Desconocida") {
                    const matchAnio = fechaRef.match(/\d{4}/);
                    if (matchAnio) anioDet = Number(matchAnio[0]);
                }

                const nuevoLibro = {
                    id: Date.now() + i,
                    numero: libros.length + count + 1,
                    estado: c[0] || "Terminado",
                    titulo: c[1] ? c[1].replace(/^"|"$/g, "") : "Sin título",
                    autor: c[2] || "",
                    inicio: c[3] || "",
                    final: c[4] || "",
                    calificacion: calificacionEstrellas,
                    personaje1: c[6] || "",
                    personaje2: c[7] || "",
                    trope: c[8] || "",
                    idioma: c[9] || "Español",
                    formato: c[10] || "Descargado",
                    saga: c[11] || "",
                    portada: c[12] || "",
                    sipnosis: c[13] || "",
                    notes: c[14] || "",
                    opinion_personal: c[14] || "",
                    paginas: Number(c[11]?.match(/\d+/)?.[0]) || 0,
                    anio: anioDet
                };
                libros.push(nuevoLibro);
                count++;
            }
        }

        guardarEnLocalStorage();
        alert(`¡Se importaron ${count} libros y reseñas correctamente!`);
        mostrarLibreria();
    };
    lector.readAsText(archivo, "UTF-8");
}

// Importar Citas desde CSV
function importarCitasCSV(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(e) {
        const textoCompleto = e.target.result;
        const filas = parseCSVMultilinea(textoCompleto);

        let count = 0;
        const inicioIndex = filas.length > 0 && filas[0][0].toLowerCase().includes("texto") ? 1 : 0;

        for (let i = inicioIndex; i < filas.length; i++) {
            const c = filas[i];
            if (c.length >= 2 && c[0]) {
                citas.push({
                    id: Date.now() + i,
                    texto: c[0].replace(/^"|"$/g, ""),
                    libro: c[1] || "",
                    autor: c[2] || "",
                    capitulo: c[3] || "",
                    pagina: c[4] || "",
                    anio: Number(c[5]) || 2026,
                    fecha: c[6] || new Date().toLocaleDateString('es-ES')
                });
                count++;
            }
        }

        guardarEnLocalStorage();
        alert(`¡Se importaron ${count} citas correctamente sin errores de estructura!`);
        paginaActualCitas = 1;
        mostrarCitas();
    };
    lector.readAsText(archivo, "UTF-8");
}

// ==========================================
// ENRUTADOR PRINCIPAL DE PÁGINAS
// ==========================================
function mostrarPagina(pagina) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === pagina) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const contenido = document.getElementById("contenido");
    if (pagina === "inicio") contenido.innerHTML = `<div class="portada-inicio"><h1>BOOK<br>JOURNAL</h1></div>`;
    else if (pagina === "libreria") mostrarLibreria();
    else if (pagina === "estanterias") mostrarEstanterias();
    else if (pagina === "favorito") mostrarFavoritosPorAnio();
    else if (pagina === "tracker") mostrarTracker();
    else if (pagina === "proximos") mostrarProximos();
    else if (pagina === "metas") mostrarMetas();
    else if (pagina === "citas") { paginaActualCitas = 1; mostrarCitas(); }
    else if (pagina === "autores") mostrarAutores();
    else if (pagina === "registro") mostrarRegistro();
    else if (pagina === "estadisticas") mostrarEstadisticas();
    else if (pagina === "adaptaciones") mostrarAdaptaciones();
    else if (pagina === "recap") mostrarRecap();
}

window.onload = function() {
    mostrarPagina('inicio');
};

// ==========================================
// VISTA: LIBRERÍA Y RESEÑAS
// ==========================================
function mostrarLibreria() {
    const contenido = document.getElementById("contenido");
    const librosFiltrados = libros.filter(l => (l.anio || 2026) === anioSeleccionado);

    let html = obtenerSelectorAniosHTML("cambiarAnioLibreria");
    html += `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
            <h2>Librería Digital (${anioSeleccionado})</h2>
            <label class="btn-tabla-accion" style="background:#5b9bd5; color:white; padding:8px 14px; border-radius:6px; cursor:pointer;">
                📥 Importar Reseñas CSV
                <input type="file" accept=".csv" onchange="importarResenasCSV(event)" style="display:none;">
            </label>
        </div>
        <div class="lista-libros">
    `;

    if (librosFiltrados.length === 0) {
        html += `<p style="grid-column: 1/-1; text-align:center; color:#777; padding:30px;">No hay libros registrados en ${anioSeleccionado}. Importa tu CSV de reseñas para comenzar.</p>`;
    } else {
        librosFiltrados.forEach((libro, index) => {
            const indexOriginal = libros.indexOf(libro);
            const idiomaClase = normalizarClase(libro.idioma) === 'ingles' ? 'ingles' : 'espanol';
            html += `
                <div class="tarjeta-libro" onclick="verDetalleLibro(${indexOriginal})">
                    <div class="contenedor-portada">
                        <span class="badge-numero">${libro.numero || index + 1}</span>
                        <img src="${libro.portada || 'https://via.placeholder.com/130x190'}" alt="${libro.titulo}">
                    </div>
                    <div class="linea-subrayado ${idiomaClase}"></div>
                    <strong style="font-size:13px; font-family:Georgia, serif;">${libro.titulo}</strong>
                    <span style="font-size:11px; color:#555;">${libro.autor}</span>
                    <div class="estrellas">${generarEstrellas(libro.calificacion)}</div>
                    <span class="badge-idioma ${idiomaClase}">${libro.idioma || 'Español'}</span>
                </div>
            `;
        });
    }

    html += `</div>`;
    contenido.innerHTML = html;
}

function cambiarAnioLibreria(a) { cambiarAnioGlobal(a, 'libreria'); }

function verDetalleLibro(index) {
    const libro = libros[index];
    const contenido = document.getElementById("contenido");
    const idiomaClase = normalizarClase(libro.idioma) === 'ingles' ? 'ingles' : 'espanol';

    let html = `
        <button class="boton-volver" onclick="mostrarPagina('libreria')">← Volver a la Librería</button>
        <div class="vista-resena">
            <h2>${libro.titulo}</h2>
            <p style="font-style:italic; font-size:14px; color:#555; margin-bottom:10px;">${libro.autor} ${libro.saga ? `— <b>${libro.saga}</b>` : ''}</p>
            <div class="resena-contenido">
                <div class="columna-izquierda-resena">
                    <div class="contenedor-portada" style="width:160px; height:230px;">
                        <img src="${libro.portada || 'https://via.placeholder.com/160x230'}" alt="${libro.titulo}">
                    </div>
                    <div class="estrellas" style="margin-top:10px;">${generarEstrellas(libro.calificacion)}</div>
                    <span class="badge-idioma ${idiomaClase}" style="margin-top:6px;">${libro.idioma || 'Español'}</span>
                    
                    <div class="caja-notas">
                        <h4>Detalles de Lectura</h4>
                        <ul>
                            ${libro.personaje1 ? `<li><b>Personaje 1:</b> ${libro.personaje1}</li>` : ''}
                            ${libro.personaje2 ? `<li><b>Personaje 2:</b> ${libro.personaje2}</li>` : ''}
                            ${libro.trope ? `<li><b>Trope:</b> ${libro.trope}</li>` : ''}
                            ${libro.formato ? `<li><b>Formato:</b> ${libro.formato}</li>` : ''}
                            ${libro.estado ? `<li><b>Estado:</b> ${libro.estado}</li>` : ''}
                        </ul>
                    </div>
                </div>
                <div class="columna-derecha-resena">
                    ${libro.sipnosis ? `<div class="texto-sinopsis"><b>Sinopsis:</b><br>${libro.sipnosis.replace(/\n/g, '<br>')}</div>` : ''}
                    <div style="margin-top:15px;"><b>Opinión / Reseña:</b><br>${(libro.notes || libro.opinion_personal || 'Sin notas adicionales.').replace(/\n/g, '<br>')}</div>
                </div>
            </div>
            <div class="metadatos-inferior">
                <div class="metadatos-row"><span>Páginas / Saga: ${libro.paginas || libro.saga || '---'}</span><span>Días de lectura: ${calcularDiasLectura(libro.inicio, libro.final)}</span></div>
                <div class="metadatos-row"><span>Fecha Inicio: ${libro.inicio || '---'}</span><span>Fecha Final: ${libro.final || '---'}</span></div>
            </div>
        </div>
    `;
    contenido.innerHTML = html;
}

// ==========================================
// VISTA: ESTANTERÍAS DE MADERA
// ==========================================
function mostrarEstanterias() {
    const contenido = document.getElementById("contenido");
    const librosFiltrados = libros.filter(l => (l.anio || 2026) === anioSeleccionado);

    let html = obtenerSelectorAniosHTML("cambiarAnioEstanteria");
    html += `<h2>Estantería Virtual (${anioSeleccionado})</h2><div class="estanteria-contenedor">`;

    // Organizar en repisas de máximo 10 libros
    for (let i = 0; i < librosFiltrados.length; i += 10) {
        const bloque = librosFiltrados.slice(i, i + 10);
        html += `<div class="repisa-madera">`;
        bloque.forEach(libro => {
            const indexOriginal = libros.indexOf(libro);
            const alto = Math.min(170, Math.max(120, (libro.paginas || 300) / 3));
            const colorBg = ['#fca5a5', '#fcd34d', '#86efac', '#93c5fd', '#c084fc', '#f472b6'][indexOriginal % 6];
            html += `
                <div class="libro-tomo" style="height:${alto}px; width:34px; background-color:${colorBg};" onclick="verDetalleLibro(${indexOriginal})" title="${libro.titulo}">
                    <span>${libro.titulo}</span>
                </div>
            `;
        });
        html += `</div>`;
    }

    if (librosFiltrados.length === 0) {
        html += `<div class="repisa-madera"><p style="width:100%; text-align:center; color:#888;">Estantería vacía para este año.</p></div>`;
    }

    html += `</div>`;
    contenido.innerHTML = html;
}

function cambiarAnioEstanteria(a) { cambiarAnioGlobal(a, 'estanterias'); }

// ==========================================
// VISTA: FAVORITO DEL MES
// ==========================================
function mostrarFavoritosPorAnio() {
    const contenido = document.getElementById("contenido");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    let html = obtenerSelectorAniosHTML("cambiarAnioFavorito");
    html += `<h2>Favorito del Mes (${anioSeleccionado})</h2><div class="contenedor-favoritos"><div class="grilla-favoritos-meses">`;

    meses.forEach((mes, idx) => {
        // Buscar libro leído en el mes de este año
        const libroFav = libros.find(l => (l.anio || 2026) === anioSeleccionado && l.final && l.final.includes(`/${String(idx + 1).padStart(2, '0')}/`));

        html += `
            <div class="tarjeta-mes-fav">
                <span class="nombre-mes-cursiva">${mes}</span>
                <div class="slot-portadas">
                    <div class="portada-slot">
                        ${libroFav ? `<img src="${libroFav.portada}" alt="${libroFav.titulo}">` : `<span>Sin favorito</span>`}
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    contenido.innerHTML = html;
}

function cambiarAnioFavorito(a) { cambiarAnioGlobal(a, 'favorito'); }

// ==========================================
// VISTA: READING TRACKER
// ==========================================
function mostrarTracker() {
    const contenido = document.getElementById("contenido");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    let html = obtenerSelectorAniosHTML("cambiarAnioTracker");
    html += `<h2>Reading Tracker (${anioSeleccionado})</h2><div class="tracker-anual-container"><div class="tracker-tabla-wrapper"><table class="tabla-tracker-anual"><thead><tr><th>Día</th>`;

    meses.forEach(m => {
        html += `<th class="th-mes"><div class="th-mes-texto">${m}</div></th>`;
    });
    html += `</tr></thead><tbody>`;

    for (let d = 1; d <= 31; d++) {
        html += `<tr><td><b>${d}</b></td>`;
        for (let m = 0; m < 12; m++) {
            const clave = `${anioSeleccionado}-${m}-${d}`;
            const paginas = habitTrackerData[clave] || 0;
            let claseRango = "rango-vacio";
            if (paginas > 0 && paginas <= 10) claseRango = "rango-0-10";
            else if (paginas <= 20) claseRango = "rango-11-20";
            else if (paginas <= 30) claseRango = "rango-21-30";
            else if (paginas <= 40) claseRango = "rango-31-40";
            else if (paginas <= 50) claseRango = "rango-41-50";
            else if (paginas <= 80) claseRango = "rango-51-80";
            else if (paginas <= 100) claseRango = "rango-81-100";
            else if (paginas > 100) claseRango = "rango-100-plus";

            html += `<td class="celda-tracker ${claseRango}" onclick="registrarPaginasTracker('${clave}')" title="${d} ${meses[m]}: ${paginas} págs"></td>`;
        }
        html += `</tr>`;
    }

    html += `</tbody></table></div>`;
    html += `
        <div class="tracker-leyenda-horizontal">
            <div class="leyenda-item"><div class="leyenda-color-box rango-0-10"></div> 1-10</div>
            <div class="leyenda-item"><div class="leyenda-color-box rango-11-20"></div> 11-20</div>
            <div class="leyenda-item"><div class="leyenda-color-box rango-21-30"></div> 21-30</div>
            <div class="leyenda-item"><div class="leyenda-color-box rango-31-40"></div> 31-40</div>
            <div class="leyenda-item"><div class="leyenda-color-box rango-41-50"></div> 41-50</div>
            <div class="leyenda-item"><div class="leyenda-color-box rango-51-80"></div> 51-80</div>
            <div class="leyenda-item"><div class="leyenda-color-box rango-81-100"></div> 81-100</div>
            <div class="leyenda-item"><div class="leyenda-color-box rango-100-plus"></div> 100+</div>
        </div>
    </div>`;
    contenido.innerHTML = html;
}

function cambiarAnioTracker(a) { cambiarAnioGlobal(a, 'tracker'); }

function registrarPaginasTracker(clave) {
    const val = prompt("Introduce el número de páginas leídas hoy:", habitTrackerData[clave] || "");
    if (val !== null) {
        habitTrackerData[clave] = Number(val) || 0;
        guardarEnLocalStorage();
        mostrarTracker();
    }
}

// ==========================================
// VISTA: PRÓXIMOS
// ==========================================
function mostrarProximos() {
    const contenido = document.getElementById("contenido");
    const proximos = libros.filter(l => l.estado === "Próximo" || l.estado === "Por leer");

    let html = `<h2>Próximas Lecturas / TBR</h2><div class="lista-libros">`;

    if (proximos.length === 0) {
        html += `<p style="grid-column:1/-1; text-align:center; color:#777; padding:20px;">No tienes lecturas pendientes en tu lista de Próximos.</p>`;
    } else {
        proximos.forEach(libro => {
            const indexOriginal = libros.indexOf(libro);
            html += `
                <div class="tarjeta-libro" onclick="verDetalleLibro(${indexOriginal})">
                    <div class="contenedor-portada">
                        <img src="${libro.portada || 'https://via.placeholder.com/130x190'}" alt="${libro.titulo}">
                    </div>
                    <strong>${libro.titulo}</strong>
                    <span style="font-size:12px; color:#555;">${libro.autor}</span>
                    <span class="badge-estado por-leer" style="margin-top:5px;">${libro.estado}</span>
                </div>
            `;
        });
    }

    html += `</div>`;
    contenido.innerHTML = html;
}

// ==========================================
// VISTA: METAS DE LECTURA
// ==========================================
function mostrarMetas() {
    const contenido = document.getElementById("contenido");
    let html = `<h2>Metas de Lectura</h2><div class="contenedor-metas">`;

    metas.forEach(meta => {
        const porcentaje = Math.min(100, Math.round((meta.actual / meta.objetivo) * 100));
        html += `
            <div class="meta-item-card">
                <input type="checkbox" class="meta-checkbox" ${meta.completada ? 'checked' : ''} onchange="toggleMeta(${meta.id})">
                <div class="meta-info">
                    <div class="meta-titulo">${meta.titulo}</div>
                    <div style="font-size:12px; color:#666;">Progreso: ${meta.actual} / ${meta.objetivo} (${porcentaje}%)</div>
                    <div class="meta-progreso-bar">
                        <div class="meta-progreso-fill" style="width: ${porcentaje}%;"></div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    contenido.innerHTML = html;
}

function toggleMeta(id) {
    const m = metas.find(x => x.id === id);
    if (m) {
        m.completada = !m.completada;
        guardarEnLocalStorage();
        mostrarMetas();
    }
}

// ==========================================
// VISTA: CITAS (CON PAGINACIÓN)
// ==========================================
function mostrarCitas() {
    const contenido = document.getElementById("contenido");
    const totalPaginas = Math.ceil(citas.length / citasPorPagina) || 1;
    const inicio = (paginaActualCitas - 1) * citasPorPagina;
    const citasPagina = citas.slice(inicio, inicio + citasPorPagina);

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
            <h2>Citas Literarias</h2>
            <label class="btn-tabla-accion" style="background:#5b9bd5; color:white; padding:8px 14px; border-radius:6px; cursor:pointer;">
                📥 Importar Citas CSV
                <input type="file" accept=".csv" onchange="importarCitasCSV(event)" style="display:none;">
            </label>
        </div>
        <div class="contenedor-citas-planner">
    `;

    if (citasPagina.length === 0) {
        html += `<p style="text-align:center; color:#777; padding:30px;">No hay citas registradas. Importa tu archivo CSV de citas para cargarlas aquí.</p>`;
    } else {
        citasPagina.forEach((c, idx) => {
            const numCita = inicio + idx + 1;
            const bgCita = ['#e0fefe', '#ffe0b2', '#f3e5f5', '#e8f5e9', '#fffde7'][idx % 5];
            html += `
                <div class="tarjeta-cita-planner">
                    <div class="cita-metadatos">
                        <div class="cita-meta-fila">Libro: <span>${c.libro || '---'}</span></div>
                        <div class="cita-meta-fila">Autor: <span>${c.autor || '---'}</span></div>
                        <div class="cita-meta-fila">Capítulo: <span>${c.capitulo || '---'}</span></div>
                        <div class="cita-meta-fila">Página: <span>${c.pagina || '---'}</span></div>
                    </div>
                    <div class="cita-caja-texto" style="background-color: ${bgCita};">
                        <span class="cita-badge-numero">${numCita}</span>
                        "${c.texto}"
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;

    // Controles de Paginación
    if (totalPaginas > 1) {
        html += `<div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-top:25px; flex-wrap:wrap;">`;
        html += `<button class="btn-anio" ${paginaActualCitas === 1 ? 'disabled style="opacity:0.5;"' : ''} onclick="cambiarPaginaCitas(${paginaActualCitas - 1})">« Ant</button>`;
        for (let p = 1; p <= totalPaginas; p++) {
            html += `<button class="btn-anio ${paginaActualCitas === p ? 'activo' : ''}" onclick="cambiarPaginaCitas(${p})">${p}</button>`;
        }
        html += `<button class="btn-anio" ${paginaActualCitas === totalPaginas ? 'disabled style="opacity:0.5;"' : ''} onclick="cambiarPaginaCitas(${paginaActualCitas + 1})">Sig »</button>`;
        html += `</div>`;
    }

    contenido.innerHTML = html;
}

function cambiarPaginaCitas(p) {
    paginaActualCitas = p;
    mostrarCitas();
}

// ==========================================
// VISTA: AUTORES
// ==========================================
function mostrarAutores() {
    const contenido = document.getElementById("contenido");
    const autoresSet = new Set();
    libros.forEach(l => { if (l.autor) autoresSet.add(l.autor.trim()); });
    const autores = Array.from(autoresSet).sort();

    let html = `<h2>Índice de Autores</h2><div class="autores-index-container"><div class="autores-grid-3cols">`;

    if (autores.length === 0) {
        html += `<p style="grid-column:1/-1; text-align:center; color:#777;">No hay autores registrados.</p>`;
    } else {
        autores.forEach(autor => {
            const cant = libros.filter(l => l.autor && l.autor.trim() === autor).length;
            html += `
                <button class="autor-btn-item" onclick="filtrarPorAutor('${autor.replace(/'/g, "\\'")}')">
                    ${autor} (${cant})
                </button>
            `;
        });
    }

    html += `</div></div>`;
    contenido.innerHTML = html;
}

function filtrarPorAutor(autor) {
    const contenido = document.getElementById("contenido");
    const librosAutor = libros.filter(l => l.autor && l.autor.trim() === autor);

    let html = `
        <button class="boton-volver" onclick="mostrarAutores()">← Volver a Autores</button>
        <h2>Libros de ${autor}</h2>
        <div class="lista-libros">
    `;

    librosAutor.forEach(libro => {
        const indexOriginal = libros.indexOf(libro);
        html += `
            <div class="tarjeta-libro" onclick="verDetalleLibro(${indexOriginal})">
                <div class="contenedor-portada">
                    <img src="${libro.portada || 'https://via.placeholder.com/130x190'}" alt="${libro.titulo}">
                </div>
                <strong>${libro.titulo}</strong>
                <div class="estrellas">${generarEstrellas(libro.calificacion)}</div>
            </div>
        `;
    });

    html += `</div>`;
    contenido.innerHTML = html;
}

// ==========================================
// VISTA: REGISTRO GENERAL
// ==========================================
function mostrarRegistro() {
    const contenido = document.getElementById("contenido");
    const librosFiltrados = libros.filter(l => (l.anio || 2026) === anioSeleccionado);

    let html = obtenerSelectorAniosHTML("cambiarAnioRegistro");
    html += `
        <h2>Registro de Lecturas (${anioSeleccionado})</h2>
        <div class="contenedor-registro-planner">
            <table class="tabla-registro-planner">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Título</th>
                        <th>Autor</th>
                        <th>Páginas</th>
                        <th>Estado</th>
                        <th>Rating</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (librosFiltrados.length === 0) {
        html += `<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">Sin datos en ${anioSeleccionado}.</td></tr>`;
    } else {
        librosFiltrados.forEach((l, i) => {
            const indexOriginal = libros.indexOf(l);
            const claseEst = normalizarClase(l.estado || 'terminado');
            html += `
                <tr style="cursor:pointer;" onclick="verDetalleLibro(${indexOriginal})">
                    <td>${l.numero || i + 1}</td>
                    <td><b>${l.titulo}</b></td>
                    <td>${l.autor}</td>
                    <td>${l.paginas || '---'}</td>
                    <td><span class="badge-estado ${claseEst}">${l.estado || 'Terminado'}</span></td>
                    <td>${generarEstrellas(l.calificacion)}</td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div>`;
    contenido.innerHTML = html;
}

function cambiarAnioRegistro(a) { cambiarAnioGlobal(a, 'registro'); }

// ==========================================
// VISTA: ESTADÍSTICAS Y GRÁFICAS
// ==========================================
function mostrarEstadisticas() {
    const contenido = document.getElementById("contenido");
    const librosAnio = libros.filter(l => (l.anio || 2026) === anioSeleccionado && (l.estado === "Terminado" || l.estado === "Leído"));

    const totalLibros = librosAnio.length;
    const totalPaginas = librosAnio.reduce((acc, l) => acc + (l.paginas || 0), 0);
    const promedioPaginas = totalLibros ? Math.round(totalPaginas / totalLibros) : 0;

    let html = obtenerSelectorAniosHTML("cambiarAnioEstadisticas");
    html += `
        <h2>Estadísticas de Lectura (${anioSeleccionado})</h2>
        <div class="panel-destacados-grid">
            <div class="card-destacado"><span>Libros Leídos</span><strong>${totalLibros}</strong></div>
            <div class="card-destacado"><span>Total Páginas</span><strong>${totalPaginas}</strong></div>
            <div class="card-destacado"><span>Promedio Págs</span><strong>${promedioPaginas}</strong></div>
            <div class="card-destacado"><span>Año</span><strong>${anioSeleccionado}</strong></div>
        </div>

        <div class="grafica-contenedor">
            <h4>Calificación en Estrellas</h4>
            <div class="grafica-barras">
    `;

    for (let est = 5; est >= 1; est--) {
        const cant = librosAnio.filter(l => (l.calificacion || 0) === est).length;
        const porc = totalLibros ? Math.round((cant / totalLibros) * 100) : 0;
        html += `
            <div class="grafica-fila">
                <span class="grafica-label">${"★".repeat(est)}</span>
                <div class="grafica-bar-bg">
                    <div class="grafica-bar-fill" style="width:${porc}%; background-color:#5b9bd5;"></div>
                </div>
                <span class="grafica-val">${cant}</span>
            </div>
        `;
    }

    html += `</div></div>`;
    contenido.innerHTML = html;
}

function cambiarAnioEstadisticas(a) { cambiarAnioGlobal(a, 'estadisticas'); }

// ==========================================
// VISTA: ADAPTACIONES
// ==========================================
function mostrarAdaptaciones() {
    const contenido = document.getElementById("contenido");
    let html = `<h2>Adaptaciones Cinematográficas</h2>`;

    if (adaptaciones.length === 0) {
        html += `<p style="text-align:center; color:#777; padding:30px;">No hay adaptaciones guardadas.</p>`;
    } else {
        adaptaciones.forEach(ad => {
            html += `
                <div class="adaptacion-card-detalle">
                    <div class="adaptacion-grid-comparativa">
                        <div class="adaptacion-columna-media">
                            <h3>📖 Libro</h3>
                            <img class="adaptacion-poster" src="${ad.portadaLibro || 'https://via.placeholder.com/170x250'}" alt="Libro">
                            <div class="adaptacion-info-detalles">
                                <div class="adaptacion-info-fila">Título: <span>${ad.tituloLibro}</span></div>
                                <div class="adaptacion-info-fila">Rating: <span>${generarEstrellas(ad.ratingLibro)}</span></div>
                            </div>
                        </div>
                        <div class="adaptacion-divisor-vertical"></div>
                        <div class="adaptacion-columna-media">
                            <h3>🎬 Película / Serie</h3>
                            <img class="adaptacion-poster" src="${ad.posterPeli || 'https://via.placeholder.com/170x250'}" alt="Película">
                            <div class="adaptacion-info-detalles">
                                <div class="adaptacion-info-fila">Título: <span>${ad.tituloPeli}</span></div>
                                <div class="adaptacion-info-fila">Rating: <span>${generarEstrellas(ad.ratingPeli)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    contenido.innerHTML = html;
}

// ==========================================
// VISTA: RECAP ANUAL
// ==========================================
function mostrarRecap() {
    const contenido = document.getElementById("contenido");
    const librosAnio = libros.filter(l => (l.anio || 2026) === anioSeleccionado && (l.estado === "Terminado" || l.estado === "Leído"));
    const top3 = [...librosAnio].sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0)).slice(0, 3);
    const totalPags = librosAnio.reduce((acc, l) => acc + (l.paginas || 0), 0);

    let html = obtenerSelectorAniosHTML("cambiarAnioRecap");
    html += `
        <div style="text-align:center;">
            <h2>Recap de Lectura (${anioSeleccionado})</h2>
            <p style="color:#555; margin-bottom:15px;">Tus mejores momentos literarios del año</p>
        </div>
        <div class="recap-top3-contenedor">
    `;

    top3.forEach((l, idx) => {
        html += `
            <div class="recap-top3-card">
                <span style="font-weight:bold; font-size:14px; color:#5b9bd5;">#${idx + 1} Top</span>
                <img src="${l.portada}" alt="${l.titulo}">
                <strong>${l.titulo}</strong>
                <span>${generarEstrellas(l.calificacion)}</span>
            </div>
        `;
    });

    html += `
        </div>
        <div class="recap-stats-centradas">
            <div class="recap-circulo-stat">
                <div class="recap-circulo-badge">${librosAnio.length}</div>
                <span style="font-weight:bold; font-size:12px;">Libros Leídos</span>
            </div>
            <div class="recap-circulo-stat">
                <div class="recap-circulo-badge">${totalPags}</div>
                <span style="font-weight:bold; font-size:12px;">Páginas Totales</span>
            </div>
        </div>
    `;

    contenido.innerHTML = html;
}

function cambiarAnioRecap(a) { cambiarAnioGlobal(a, 'recap'); }

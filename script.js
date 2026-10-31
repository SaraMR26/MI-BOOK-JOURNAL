// --- BASE DE DATOS LOCAL Y ESTADOS GLOBALES ---
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

// Filtros globales para Librería
let filtroBusquedaLibreria = "";
let filtroEstrellasLibreria = "todos";
let filtroTropeLibreria = "todos";

// --- PERSISTENCIA Y FUNCIONES DE APOYO ---
function guardarEnLocalStorage() {
    localStorage.setItem("libros", JSON.stringify(libros));
    localStorage.setItem("citas", JSON.stringify(citas));
    localStorage.setItem("adaptaciones", JSON.stringify(adaptaciones));
    localStorage.setItem("habitTrackerData", JSON.stringify(habitTrackerData));
    localStorage.setItem("metas", JSON.stringify(metas));
}

function generarEstrellas(rating) {
    let s = "";
    const num = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
        s += i <= num ? "★" : "☆";
    }
    return `<span style="color: #f39c12 !important; font-size:18px;">${s}</span>`;
}

function calcularDiasLectura(inicioStr, finalStr) {
    if (!inicioStr || !finalStr) return "---";
    const parseFecha = (str) => {
        const partes = str.split('/');
        if (partes.length === 3) return new Date(partes[2], partes[1] - 1, partes[0]);
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

// --- NAVEGACIÓN ENTRE SECCIONES ---
function mostrarPagina(pagina) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === pagina) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const contenido = document.getElementById("contenido");
    if (!contenido) return;

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
    else if (pagina === "recap") mostrarRecapPorAnio();
}

// --- VISTA LIBRERÍA CON BÚSQUEDA Y FILTROS ---
function mostrarLibreria() {
    const contenido = document.getElementById("contenido");

    if (libros.length === 0) {
        contenido.innerHTML = `
            <h2 style="font-size:24px; font-weight:bold; margin-bottom:15px;">LIBRERÍA</h2>
            <p style="text-align:center; color:#666; margin-top:40px;">Tu librería está vacía. Registra libros en <strong>Registro</strong> o <strong>Próximos</strong>.</p>
        `;
        return;
    }

    let setTropes = new Set();
    libros.forEach(l => {
        if (l.tropes && Array.isArray(l.tropes)) {
            l.tropes.forEach(t => { if (t.trim()) setTropes.add(t.trim()); });
        }
    });
    let listaTropesUnicos = Array.from(setTropes).sort((a, b) => a.localeCompare(b));

    let librosFiltrados = libros.filter(l => {
        const coincideTexto = (l.titulo || "").toLowerCase().includes(filtroBusquedaLibreria.toLowerCase()) ||
                              (l.autor || "").toLowerCase().includes(filtroBusquedaLibreria.toLowerCase());

        const coincideEstrellas = filtroEstrellasLibreria === "todos" || 
                                  Math.round(l.rating || 0) === Number(filtroEstrellasLibreria);

        const coincideTrope = filtroTropeLibreria === "todos" || 
                              (l.tropes && Array.isArray(l.tropes) && l.tropes.some(t => t.trim().toLowerCase() === filtroTropeLibreria.toLowerCase()));

        return coincideTexto && coincideEstrellas && coincideTrope;
    });

    let opcionesTropesHTML = `<option value="todos" ${filtroTropeLibreria === 'todos' ? 'selected' : ''}>Todos los Tropes</option>`;
    listaTropesUnicos.forEach(t => {
        opcionesTropesHTML += `<option value="${t}" ${filtroTropeLibreria === t ? 'selected' : ''}>${t}</option>`;
    });

    let tarjetas = "";
    if (librosFiltrados.length === 0) {
        tarjetas = `<p style="text-align:center; color:#666; grid-column: 1 / -1; margin-top:30px;">No se encontraron libros con los filtros seleccionados.</p>`;
    } else {
        librosFiltrados.forEach((l) => {
            const num = l.numero || (libros.findIndex(item => item.id === l.id) + 1);
            const idiomaClase = (l.idioma || "Español").toLowerCase().includes("ing") ? "ingles" : "espanol";
            const estadoTxt = (l.estado === "Próximo" || l.estado === "Por leer") ? `<span class="badge-estado proximo" style="font-size:9px; margin-top:2px;">Próximo</span>` : "";

            tarjetas += `
                <div class="tarjeta-libro" onclick="verResenaLibro(${l.id})">
                    <div class="contenedor-portada">
                        <span class="badge-numero">${num}</span>
                        <img src="${l.portada}" onerror="this.src='imagenes/libro-default.jpg'">
                    </div>
                    <div class="estrellas">${generarEstrellas(l.rating)}</div>
                    <div class="linea-subrayado ${idiomaClase}">${l.titulo}</div>
                    <div style="font-size:12px; color:#555;">${l.autor}</div>
                    <span class="badge-idioma ${idiomaClase}">${l.idioma || 'Español'}</span>
                    ${estadoTxt}
                </div>
            `;
        });
    }

    contenido.innerHTML = `
        <h2 style="font-size:24px; font-weight:bold; margin-bottom:15px;">LIBRERÍA</h2>
        
        <div style="background:#ffffff; padding:15px; border-radius:10px; border:1px solid #bce1f7; margin-bottom:20px; display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            <div style="flex:2; min-width:200px;">
                <input type="text" id="input-busqueda-libreria" value="${filtroBusquedaLibreria}" placeholder="🔍 Buscar por título o autor..." 
                       oninput="filtrarLibreriaTexto(this.value)" 
                       style="width:100%; padding:8px 12px; border:1px solid #ccc; border-radius:6px; font-family:inherit; font-size:13px;">
            </div>

            <div style="flex:1; min-width:140px;">
                <select onchange="filtrarLibreriaEstrellas(this.value)" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-family:inherit; font-size:13px;">
                    <option value="todos" ${filtroEstrellasLibreria === 'todos' ? 'selected' : ''}>⭐ Todas las estrellas</option>
                    <option value="5" ${filtroEstrellasLibreria === '5' ? 'selected' : ''}>★★★★★ (5 Estrellas)</option>
                    <option value="4" ${filtroEstrellasLibreria === '4' ? 'selected' : ''}>★★★★☆ (4 Estrellas)</option>
                    <option value="3" ${filtroEstrellasLibreria === '3' ? 'selected' : ''}>★★★☆☆ (3 Estrellas)</option>
                    <option value="2" ${filtroEstrellasLibreria === '2' ? 'selected' : ''}>★★☆☆☆ (2 Estrellas)</option>
                    <option value="1" ${filtroEstrellasLibreria === '1' ? 'selected' : ''}>★☆☆☆☆ (1 Estrella)</option>
                </select>
            </div>

            <div style="flex:1; min-width:150px;">
                <select onchange="filtrarLibreriaTrope(this.value)" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px; font-family:inherit; font-size:13px;">
                    ${opcionesTropesHTML}
                </select>
            </div>

            <button onclick="limpiarFiltrosLibreria()" class="boton-volver" style="background:#e2e8f0; color:#2c3e50; margin:0; padding:8px 12px; font-size:12px;">Resetear</button>
        </div>

        <div class="lista-libros">${tarjetas}</div>
    `;
}

function filtrarLibreriaTexto(valor) {
    filtroBusquedaLibreria = valor;
    mostrarLibreria();
    const inputBusqueda = document.getElementById("input-busqueda-libreria");
    if (inputBusqueda) {
        inputBusqueda.focus();
        inputBusqueda.setSelectionRange(valor.length, valor.length);
    }
}

function filtrarLibreriaEstrellas(valor) {
    filtroEstrellasLibreria = valor;
    mostrarLibreria();
}

function filtrarLibreriaTrope(valor) {
    filtroTropeLibreria = valor;
    mostrarLibreria();
}

function limpiarFiltrosLibreria() {
    filtroBusquedaLibreria = "";
    filtroEstrellasLibreria = "todos";
    filtroTropeLibreria = "todos";
    mostrarLibreria();
}

function verResenaLibro(id) {
    const l = libros.find(item => item.id === id);
    if (!l) return;
    const dias = calcularDiasLectura(l.inicio, l.final);
    const idiomaClase = (l.idioma || "Español").toLowerCase().includes("ing") ? "ingles" : "espanol";

    document.getElementById("contenido").innerHTML = `
        <div class="vista-resena">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <button onclick="mostrarLibreria()" class="boton-volver">← Volver</button>
                <div>
                    <button onclick="eliminarLibro(${l.id})" class="boton-volver" style="background:#f87171; color:white;">🗑️ Borrar</button>
                </div>
            </div>
            <div class="resena-contenido">
                <div class="columna-izquierda-resena">
                    <div class="contenedor-portada" style="width:160px; height:230px;">
                        <span class="badge-numero">${l.numero || 1}</span>
                        <img src="${l.portada}" onerror="this.src='imagenes/libro-default.jpg'">
                    </div>
                    <div class="estrellas" style="font-size:22px; margin-top:8px;">${generarEstrellas(l.rating)}</div>
                    <div class="linea-subrayado ${idiomaClase}" style="text-align:center;">${l.titulo}</div>
                    <div style="font-size:13px; text-align:center; margin-bottom:4px;">${l.autor}</div>
                    <span class="badge-idioma ${idiomaClase}">${l.idioma || 'Español'}</span>
                    <div class="caja-notas" style="margin-top:10px;"><h4>NOTAS / TROPES:</h4><ul>${(l.tropes || []).map(t=>`<li>${t}</li>`).join('') || '<li>Sin notas</li>'}</ul></div>
                </div>
                <div class="columna-derecha-resena">
                    <div class="texto-sinopsis">${l.sinopsis || "Sin sinopsis disponible."}</div>
                    <div class="metadatos-inferior">
                        <div class="metadatos-row"><span>IDIOMA: <b>${l.idioma || 'Español'}</b></span><span>ESTADO: <b>${l.estado}</b></span></div>
                        <div class="metadatos-row"><span>PÁGINAS: ${l.paginas||'---'}</span><span>SAGA: ${l.saga||'Autoconclusivo'}</span></div>
                        <div class="metadatos-row"><span>INICIO: ${l.inicio||'---'}</span><span>FINAL: ${l.final||'---'} (${dias})</span></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function eliminarLibro(id) {
    if (confirm("¿Estás segura de eliminar este libro de la librería?")) {
        libros = libros.filter(l => l.id !== id);
        guardarEnLocalStorage();
        mostrarLibreria();
    }
}

// --- IMPORTADOR CSV MULTILÍNEA ---
function importarDesdeCSV(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        const textoCompleto = e.target.result;
        const lineas = textoCompleto.split(/\r\n|\n/);
        let filas = [];
        let filaActual = [];
        let dentroDeComillas = false;
        let bufferCelda = "";

        for (let linea of lineas) {
            for (let i = 0; i < linea.length; i++) {
                const char = linea[i];
                if (char === '"') {
                    dentroDeComillas = !dentroDeComillas;
                    bufferCelda += char;
                } else if (char === ',' && !dentroDeComillas) {
                    filaActual.push(bufferCelda.trim());
                    bufferCelda = "";
                } else {
                    bufferCelda += char;
                }
            }
            if (dentroDeComillas) {
                bufferCelda += "\n";
            } else {
                filaActual.push(bufferCelda.trim());
                if (filaActual.length > 1 || filaActual[0] !== "") {
                    filas.push(filaActual);
                }
                filaActual = [];
                bufferCelda = "";
            }
        }

        let importadosCount = 0;
        const inicioIndex = filas.length > 0 && filas[0][0].toLowerCase().includes("titulo") ? 1 : 0;

        for (let i = inicioIndex; i < filas.length; i++) {
            const c = filas[i];
            if (c.length >= 2 && c[0]) {
                const limpiar = (val) => (val || "").replace(/^"|"$/g, "").trim();

                const titulo = limpiar(c[0]);
                const autor = limpiar(c[1]);
                const paginas = Number(limpiar(c[2])) || 0;
                const inicio = limpiar(c[3]);
                const final = limpiar(c[4]);
                const estado = limpiar(c[5]) || "Terminado";
                
                const ratingBruto = limpiar(c[6]);
                let ratingNum = 5;
                if (!isNaN(ratingBruto) && ratingBruto !== "") ratingNum = Number(ratingBruto) || 5;
                else ratingNum = (ratingBruto.match(/★/g) || []).length || 5;

                const p1 = limpiar(c[7]);
                const p2 = limpiar(c[8]);
                const personajes = [p1, p2].filter(p => p).join(", ");
                
                const tropeRaw = limpiar(c[9]);
                const tropes = tropeRaw ? tropeRaw.split(/[-;,]/).map(t => t.trim()).filter(t => t) : [];

                const idioma = limpiar(c[10]) || "Español";
                const formato = limpiar(c[11]);
                const saga = limpiar(c[12]) || "Autoconclusivo";
                
                const portadaRaw = limpiar(c[13]);
                const portada = portadaRaw.includes(".") ? portadaRaw : "imagenes/libro-default.jpg";

                const sinopsis = limpiar(c[14]);
                const notes = limpiar(c[15]);

                let anioLibro = 2026;
                if (final && final.includes('/')) {
                    const partes = final.split('/');
                    if (partes.length === 3 && partes[2].length === 4) {
                        anioLibro = Number(partes[2]) || 2026;
                    }
                }

                let mesLibro = "enero";
                if (final && final.includes('/')) {
                    const mesNum = Number(final.split('/')[1]);
                    const mesesArr = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
                    if (mesNum >= 1 && mesNum <= 12) mesLibro = mesesArr[mesNum - 1];
                }

                libros.push({
                    id: Date.now() + i,
                    numero: libros.length + 1,
                    titulo: titulo,
                    autor: autor,
                    paginas: paginas,
                    inicio: inicio,
                    final: final,
                    estado: estado,
                    rating: ratingNum,
                    personajes: personajes,
                    idioma: idioma,
                    formato: formato,
                    saga: saga,
                    anio: anioLibro,
                    mes: mesLibro,
                    portada: portada,
                    sinopsis: sinopsis,
                    tropes: tropes,
                    notes: notes,
                    esFavoritoMes: false
                });
                importadosCount++;
            }
        }

        guardarEnLocalStorage();
        alert(`¡Se han importado ${importadosCount} reseñas exitosamente desde tu archivo CSV!`);
        mostrarLibreria();
    };
    lector.readAsText(archivo);
}

// --- ESTADÍSTICAS Y TOP 5 TROPES ---
function mostrarEstadisticas(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const lAnio = libros.filter(l => (l.anio || 2026) === anioSeleccionado);
    const terminadosList = lAnio.filter(l => l.estado === "Terminado" || l.estado === "Leído");
    const proximosList = lAnio.filter(l => l.estado === "Próximo" || l.estado === "Por leer");

    const terminadosCount = terminadosList.length;
    const proximosCount = proximosList.length;

    const tropesConteo = {};
    terminadosList.forEach(l => {
        if (l.tropes && Array.isArray(l.tropes)) {
            l.tropes.forEach(t => {
                const tropeNorm = t.trim();
                if (tropeNorm) {
                    tropesConteo[tropeNorm] = (tropesConteo[tropeNorm] || 0) + 1;
                }
            });
        }
    });

    const listaTropes = Object.keys(tropesConteo).map(k => ({ trope: k, cantidad: tropesConteo[k] }));
    const topTropes = [...listaTropes].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
    const menosTropes = [...listaTropes].sort((a, b) => a.cantidad - b.cantidad).slice(0, 5);

    let htmlTopTropes = topTropes.map(item => {
        const pct = terminadosCount > 0 ? (item.cantidad / terminadosCount) * 100 : 0;
        return `
            <div class="grafica-fila">
                <div class="grafica-label" style="width:140px; text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.trope}</div>
                <div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width: ${pct}%; background:#4ade80;"></div></div>
                <div class="grafica-val">${item.cantidad}</div>
            </div>
        `;
    }).join('') || '<p style="font-size:12px; color:#666;">No hay tropes suficientes en este año.</p>';

    let htmlMenosTropes = menosTropes.map(item => {
        const pct = terminadosCount > 0 ? (item.cantidad / terminadosCount) * 100 : 0;
        return `
            <div class="grafica-fila">
                <div class="grafica-label" style="width:140px; text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.trope}</div>
                <div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width: ${pct}%; background:#f87171;"></div></div>
                <div class="grafica-val">${item.cantidad}</div>
            </div>
        `;
    }).join('') || '<p style="font-size:12px; color:#666;">No hay tropes suficientes en este año.</p>';

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    terminadosList.forEach(l => { const r = Math.round(l.rating || 0); if (ratingCounts[r] !== undefined) ratingCounts[r]++; });

    let graficaRatingRows = "";
    for (let r = 5; r >= 1; r--) {
        const cant = ratingCounts[r];
        const pct = terminadosCount > 0 ? (cant / terminadosCount) * 100 : 0;
        graficaRatingRows += `<div class="grafica-fila"><div class="grafica-label">${r} ★</div><div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width: ${pct}%; background:#f39c12;"></div></div><div class="grafica-val">${cant}</div></div>`;
    }

    contenido.innerHTML = `
        <div class="contenedor-registro-planner">
            <h2 style="text-align:center; margin-bottom:5px;">📈 ESTADÍSTICAS Y GRÁFICAS (${anioSeleccionado})</h2>
            ${obtenerSelectorAniosHTML('mostrarEstadisticas')}

            <div class="panel-destacados-grid">
                <div class="card-destacado"><span>Terminados / Próximos</span><strong>${terminadosCount} / ${proximosCount}</strong></div>
            </div>

            <div class="grafica-contenedor">
                <h4>🔥 Top 5 Tropes / Clichés Más Leídos</h4>
                <div class="grafica-barras">${htmlTopTropes}</div>
            </div>

            <div class="grafica-contenedor">
                <h4>❄️ Tropes / Clichés Menos Leídos</h4>
                <div class="grafica-barras">${htmlMenosTropes}</div>
            </div>

            <div class="grafica-contenedor">
                <h4>📊 Distribución de Puntuaciones (Libros Terminados)</h4>
                <div class="grafica-barras">${graficaRatingRows}</div>
            </div>
        </div>
    `;
}

// --- VACIAR DATOS ---
function vaciarCitas() {
    if (confirm("⚠️ ¿Estás segura de que deseas borrar TODAS las citas registradas?")) {
        citas = [];
        guardarEnLocalStorage();
        mostrarCitas();
    }
}

function vaciarAdaptaciones() {
    if (confirm("⚠️ ¿Estás segura de que deseas borrar TODAS las adaptaciones registradas?")) {
        adaptaciones = [];
        guardarEnLocalStorage();
        mostrarAdaptaciones();
    }
}

function vaciarTodosLosDatos() {
    if (confirm("⚠️ ¿Estás segura de que deseas borrar TODOS los libros y datos registrados? Esta acción no se puede deshacer.")) {
        localStorage.clear();
        location.reload();
    }
}

window.onload = () => { mostrarPagina('inicio'); };
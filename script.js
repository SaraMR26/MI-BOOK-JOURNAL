// --- BASE DE DATOS LOCAL ---
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

function guardarEnLocalStorage() {
    localStorage.setItem("libros", JSON.stringify(libros));
    localStorage.setItem("citas", JSON.stringify(citas));
    localStorage.setItem("adaptaciones", JSON.stringify(adaptaciones));
    localStorage.setItem("habitTrackerData", JSON.stringify(habitTrackerData));
    localStorage.setItem("metas", JSON.stringify(metas));
}

function generarEstrellas(rating, inactivo = false) {
    let s = "";
    const num = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
        s += i <= num ? "★" : "☆";
    }
    const colorEstilo = inactivo ? "color: #e53e3e !important;" : "color: #f39c12 !important;";
    return `<span style="${colorEstilo} font-size:18px;">${s}</span>`;
}

function obtenerNumeroLibroEnLibreria(tituloLibro) {
    if (!tituloLibro) return "";
    const index = libros.findIndex(l => l.titulo && l.titulo.trim().toLowerCase() === tituloLibro.trim().toLowerCase());
    return index !== -1 ? (libros[index].numero || index + 1) : "";
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
    else if (pagina === "recap") mostrarRecapPorAnio();
}

// --- LIBRERÍA Y CSV DE RESEÑAS CON FILTROS ---
function mostrarLibreria() {
    const contenido = document.getElementById("contenido");
    
    const inputBusqueda = document.getElementById("busquedaLibro");
    const selectRating = document.getElementById("filtroRating");
    const selectTrope = document.getElementById("filtroTrope");

    const filtroTexto = inputBusqueda ? inputBusqueda.value.toLowerCase() : "";
    const filtroRating = selectRating ? selectRating.value : "todos";
    const filtroTrope = selectTrope ? selectTrope.value : "todos";

    let tropesUnicos = new Set();
    libros.forEach(l => {
        if (l.tropes && Array.isArray(l.tropes)) {
            l.tropes.forEach(t => { if (t) tropesUnicos.add(t.trim()); });
        }
    });
    let opcionesTropesHTML = `<option value="todos">Todos los tropes</option>`;
    Array.from(tropesUnicos).sort().forEach(t => {
        opcionesTropesHTML += `<option value="${t}" ${filtroTrope === t ? 'selected' : ''}>${t}</option>`;
    });

    let headerLibreria = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
            <h2 style="font-size:24px; font-weight:bold;">LIBRERÍA</h2>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <input type="text" id="busquedaLibro" value="${filtroTexto}" placeholder="🔍 Título/autor..." oninput="filtrarLibreriaEnVivo()" style="padding: 6px 10px; border: 1px solid #bce1f7; border-radius: 6px; font-size: 12px; width: 140px;">
                
                <select id="filtroRating" onchange="filtrarLibreriaEnVivo()" style="padding: 6px; border: 1px solid #bce1f7; border-radius: 6px; font-size: 12px; background: white;">
                    <option value="todos" ${filtroRating === 'todos' ? 'selected' : ''}>Estrellas</option>
                    <option value="5" ${filtroRating === '5' ? 'selected' : ''}>★★★★★ (5)</option>
                    <option value="4" ${filtroRating === '4' ? 'selected' : ''}>★★★★☆ (4)</option>
                    <option value="3" ${filtroRating === '3' ? 'selected' : ''}>★★★☆☆ (3)</option>
                    <option value="2" ${filtroRating === '2' ? 'selected' : ''}>★★☆☆☆ (2)</option>
                    <option value="1" ${filtroRating === '1' ? 'selected' : ''}>★☆☆☆☆ (1)</option>
                </select>

                <select id="filtroTrope" onchange="filtrarLibreriaEnVivo()" style="padding: 6px; border: 1px solid #bce1f7; border-radius: 6px; font-size: 12px; background: white; max-width: 140px;">
                    ${opcionesTropesHTML}
                </select>

                <input type="file" id="input-csv-resenas" accept=".txt,.csv" style="display:none" onchange="importarResenasCSV(event)">
                <button onclick="document.getElementById('input-csv-resenas').click()" class="boton-volver" style="background:#48bb78; color:white; margin:0; font-size:12px;">📂 Importar</button>
            </div>
        </div>
    `;

    if (libros.length === 0) {
        contenido.innerHTML = `${headerLibreria}<p style="text-align:center; color:#666; margin-top:40px;">Tu librería está vacía. Importa tu archivo RESEÑA.txt[cite: 1].</p>`;
        return;
    }

    let librosFiltrados = libros.filter(l => {
        let matchTexto = (l.titulo && l.titulo.toLowerCase().includes(filtroTexto)) || (l.autor && l.autor.toLowerCase().includes(filtroTexto));
        let matchRating = filtroRating === 'todos' || Number(l.rating) === Number(filtroRating);
        let matchTrope = filtroTrope === 'todos' || (l.tropes && l.tropes.map(t => t.trim()).includes(filtroTrope));
        return matchTexto && matchRating && matchTrope;
    });

    let tarjetas = "";
    if (librosFiltrados.length === 0) {
        tarjetas = `<p style="text-align:center; color:#666; margin-top:30px; grid-column: 1 / -1;">No se encontraron libros con los filtros seleccionados.</p>`;
    } else {
        librosFiltrados.forEach((l, i) => {
            const num = l.numero || (i + 1);
            const idiomaClase = (l.idioma || "Español").toLowerCase().includes("ing") ? "ingles" : "espanol";
            const estadoTxt = (l.estado === "Próximo" || l.estado === "Por leer") ? `<span class="badge-estado proximo" style="font-size:9px; margin-top:2px;">Próximo</span>` : "";
            tarjetas += `
                <div class="tarjeta-libro" onclick="verResenaLibro(${l.id})">
                    <div class="contenedor-portada">
                        <span class="badge-numero">${num}</span>
                        <img src="${l.portada || 'imagenes/libro-default.jpg'}" onerror="this.src='imagenes/libro-default.jpg'">
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

    contenido.innerHTML = `${headerLibreria}<div class="lista-libros">${tarjetas}</div>`;
}

function filtrarLibreriaEnVivo() {
    const filtroTexto = document.getElementById("busquedaLibro").value.toLowerCase();
    const filtroRating = document.getElementById("filtroRating").value;
    const filtroTrope = document.getElementById("filtroTrope").value;
    const contenedorTarjetas = document.querySelector(".lista-libros");
    
    let librosFiltrados = libros.filter(l => {
        let matchTexto = (l.titulo && l.titulo.toLowerCase().includes(filtroTexto)) || (l.autor && l.autor.toLowerCase().includes(filtroTexto));
        let matchRating = filtroRating === 'todos' || Number(l.rating) === Number(filtroRating);
        let matchTrope = filtroTrope === 'todos' || (l.tropes && l.tropes.map(t => t.trim()).includes(filtroTrope));
        return matchTexto && matchRating && matchTrope;
    });

    let tarjetas = "";
    if (librosFiltrados.length === 0) {
        tarjetas = `<p style="text-align:center; color:#666; margin-top:30px; grid-column: 1 / -1;">No se encontraron libros con los filtros seleccionados.</p>`;
    } else {
        librosFiltrados.forEach((l, i) => {
            const num = l.numero || (i + 1);
            const idiomaClase = (l.idioma || "Español").toLowerCase().includes("ing") ? "ingles" : "espanol";
            const estadoTxt = (l.estado === "Próximo" || l.estado === "Por leer") ? `<span class="badge-estado proximo" style="font-size:9px; margin-top:2px;">Próximo</span>` : "";
            tarjetas += `
                <div class="tarjeta-libro" onclick="verResenaLibro(${l.id})">
                    <div class="contenedor-portada">
                        <span class="badge-numero">${num}</span>
                        <img src="${l.portada || 'imagenes/libro-default.jpg'}" onerror="this.src='imagenes/libro-default.jpg'">
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
    if (contenedorTarjetas) contenedorTarjetas.innerHTML = tarjetas;
}

// Parser multilínea infalible para RESEÑA.txt (soportando comillas y saltos de línea internos)
function importarResenasCSV(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(e) {
        const textoCompleto = e.target.result;
        let filas = [];
        let filaActual = [];
        let dentroDeComillas = false;
        let bufferCelda = "";

        for (let i = 0; i < textoCompleto.length; i++) {
            let char = textoCompleto[i];
            let nextChar = textoCompleto[i + 1];

            if (char === '"') {
                if (dentroDeComillas && nextChar === '"') {
                    bufferCelda += '"';
                    i++;
                } else {
                    dentroDeComillas = !dentroDeComillas;
                }
            } else if (char === ',' && !dentroDeComillas) {
                filaActual.push(bufferCelda.trim());
                bufferCelda = "";
            } else if ((char === '\r' || char === '\n') && !dentroDeComillas) {
                if (char === '\r' && nextChar === '\n') i++;
                filaActual.push(bufferCelda.trim());
                if (filaActual.length > 1 || filaActual[0] !== "") {
                    filas.push(filaActual);
                }
                filaActual = [];
                bufferCelda = "";
            } else {
                bufferCelda += char;
            }
        }
        if (bufferCelda !== "" || filaActual.length > 0) {
            filaActual.push(bufferCelda.trim());
            filas.push(filaActual);
        }

        if (filas.length < 2) {
            alert("El archivo está vacío o no contiene filas válidas.");
            return;
        }

        // Encabezado exacto: titulo,autor,paginas,inicio,final,estado,rating,personaje1,personaje2,trope,idioma,formato,saga,portada,sinopsis,notes[cite: 1]
        let headers = filas[0].map(h => h.toLowerCase().replace(/^\ufeff/, '').trim());
        let nuevosLibros = [];

        for (let i = 1; i < filas.length; i++) {
            let row = filas[i];
            let obj = {};
            for (let j = 0; j < headers.length; j++) {
                let val = row[j] !== undefined ? row[j].replace(/^"|"$/g, "").trim() : "";
                obj[headers[j]] = val;
            }
            if (obj.titulo) {
                let anioExt = obj.final ? (obj.final.split('/')[2] || 2026) : 2026;
                nuevosLibros.push({
                    id: Date.now() + i,
                    numero: i,
                    titulo: obj.titulo,
                    autor: obj.autor || "Desconocido",
                    paginas: Number(obj.paginas) || 0,
                    inicio: obj.inicio || "",
                    final: obj.final || "",
                    estado: obj.estado || "Terminado",
                    rating: Number(obj.rating) || 5,
                    personaje1: obj.personaje1 || "",
                    personaje2: obj.personaje2 || "",
                    tropes: obj.trope ? obj.trope.split(',').map(t => t.trim().replace(/^"|"$/g, "")) : [],
                    idioma: obj.idioma || "Español",
                    formato: obj.formato || "Físico",
                    saga: obj.saga || "",
                    portada: obj.portada || "imagenes/libro-default.jpg",
                    sinopsis: obj.sinopsis || "",
                    notes: obj.notes || "",
                    anio: Number(anioExt),
                    mes: "enero",
                    esFavoritoMes: false
                });
            }
        }

        if (nuevosLibros.length > 0) {
            libros = nuevosLibros;
            guardarEnLocalStorage();
            alert(`¡Se importaron ${libros.length} reseñas exitosamente desde RESEÑA.txt[cite: 1]!`);
            mostrarLibreria();
        } else {
            alert("No se pudieron procesar los registros. Verifica el formato del encabezado.");
        }
    };
    lector.readAsText(archivo, 'UTF-8');
}

function verResenaLibro(id) {
    const l = libros.find(item => item.id === id);
    if (!l) return;
    const dias = calcularDiasLectura(l.inicio, l.final);
    const idiomaClase = (l.idioma || "Español").toLowerCase().includes("ing") ? "ingles" : "espanol";
    const listaTropesStr = (l.tropes || []).join(', ');
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
                    <div class="caja-notas" style="margin-top:10px;"><h4>TROPES:</h4><p>${listaTropesStr || 'Sin tropes'}</p></div>
                </div>
                <div class="columna-derecha-resena">
                    <div class="texto-sinopsis"><b>Sinopsis:</b><br>${l.sinopsis || "Sin sinopsis disponible."}</div>
                    <div class="texto-sinopsis" style="margin-top:10px;"><b>Notas / Opiniones:</b><br>${l.notes || "Sin notas registradas."}</div>
                    <div class="metadatos-inferior">
                        <div class="metadatos-row"><span>PERSONAJES: <b>${l.personaje1 || '---'} & ${l.personaje2 || '---'}</b></span></div>
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
    if (confirm("¿Estás seguro de eliminar este libro?")) {
        libros = libros.filter(item => item.id !== id);
        guardarEnLocalStorage();
        mostrarLibreria();
    }
}

// --- ESTADÍSTICAS CON TOP 5 DE TROPES ---
function mostrarEstadisticas() {
    const contenido = document.getElementById("contenido");
    
    let conteoTropes = {};
    libros.forEach(l => {
        if (l.tropes && Array.isArray(l.tropes)) {
            l.tropes.forEach(t => {
                if (t) {
                    let limpio = t.trim();
                    conteoTropes[limpio] = (conteoTropes[limpio] || 0) + 1;
                }
            });
        }
    });

    let tropesOrdenados = Object.entries(conteoTropes).sort((a, b) => b[1] - a[1]);
    let top5Mas = tropesOrdenados.slice(0, 5);
    let top5Menos = [...tropesOrdenados].reverse().slice(0, 5);
    let maxValor = top5Mas.length > 0 ? top5Mas[0][1] : 1;

    let htmlMas = top5Mas.length > 0 ? top5Mas.map(([t, c]) => {
        let porcentaje = Math.round((c / maxValor) * 100);
        return `
            <div class="grafica-fila">
                <span class="grafica-label" style="width:130px; text-align:left;" title="${t}">${t}</span>
                <div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width: ${porcentaje}%; background-color: #5b9bd5;"></div></div>
                <span class="grafica-val">${c}</span>
            </div>
        `;
    }).join('') : '<p style="font-size:12px; color:#666; text-align:center;">No hay suficientes datos de tropes[cite: 1].</p>';

    let htmlMenos = top5Menos.length > 0 ? top5Menos.map(([t, c]) => {
        let porcentaje = Math.round((c / maxValor) * 100);
        return `
            <div class="grafica-fila">
                <span class="grafica-label" style="width:130px; text-align:left;" title="${t}">${t}</span>
                <div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width: ${porcentaje}%; background-color: #f6ad55;"></div></div>
                <span class="grafica-val">${c}</span>
            </div>
        `;
    }).join('') : '<p style="font-size:12px; color:#666; text-align:center;">No hay suficientes datos de tropes[cite: 1].</p>';

    const totalLeidos = libros.filter(l => l.estado === "Terminado" || l.estado === "Leído").length;
    const totalPaginas = libros.filter(l => l.estado === "Terminado" || l.estado === "Leído").reduce((acc, l) => acc + (Number(l.paginas) || 0), 0);

    contenido.innerHTML = `
        <h2>📈 Estadísticas Generales</h2>
        <div class="panel-destacados-grid" style="margin-bottom:20px;">
            <div class="card-destacado"><span>Libros Leídos</span><strong>${totalLeidos}</strong></div>
            <div class="card-destacado"><span>Páginas Totales</span><strong>${totalPaginas}</strong></div>
            <div class="card-destacado"><span>Total Tropes Únicos</span><strong>${tropesOrdenados.length}</strong></div>
            <div class="card-destacado"><span>Año Activo</span><strong>${anioSeleccionado}</strong></div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            <div class="grafica-contenedor">
                <h4>🔥 Top 5 Tropes Más Leídos[cite: 1]</h4>
                <div class="grafica-barras">${htmlMas}</div>
            </div>
            <div class="grafica-contenedor">
                <h4>🧊 Top 5 Tropes Menos Leídos (Por explorar)[cite: 1]</h4>
                <div class="grafica-barras">${htmlMenos}</div>
            </div>
        </div>
    `;
}

// --- CITAS CON PAGINACIÓN (10 POR PÁGINA) ---
function mostrarCitas() {
    const contenido = document.getElementById("contenido");
    const totalCitas = citas.length;
    
    const botonesAccionCitas = `
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <input type="file" id="input-csv-citas" accept=".csv" style="display:none" onchange="importarCitasCSV(event)">
            <button onclick="document.getElementById('input-csv-citas').click()" class="boton-volver" style="background:#48bb78; color:white; margin:0;">📂 CSV Citas</button>
        </div>
    `;

    if (citas.length === 0) {
        contenido.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
                <h2 style="font-size:24px; font-weight:bold;">CITAS</h2>
                ${botonesAccionCitas}
            </div>
            <p style="text-align:center; color:#666; margin-top:40px;">No tienes citas guardadas todavía.</p>
        `;
        return;
    }

    const totalPaginas = Math.ceil(citas.length / citasPorPagina);
    if (paginaActualCitas > totalPaginas) paginaActualCitas = totalPaginas;
    if (paginaActualCitas < 1) paginaActualCitas = 1;

    const inicioSlice = (paginaActualCitas - 1) * citasPorPagina;
    const finSlice = inicioSlice + citasPorPagina;
    const citasPaginadas = citas.slice(inicioSlice, finSlice);

    let htmlCitas = citasPaginadas.map(c => {
        const numLibreria = obtenerNumeroLibroEnLibreria(c.libro);
        return `
            <div class="tarjeta-cita-planner">
                <div class="cita-metadatos">
                    <div class="cita-meta-fila">LIBRO: <span>${c.libro || '---'}</span></div>
                    <div class="cita-meta-fila">AUTOR/A: <span>${c.autor || '---'}</span></div>
                    <div class="cita-meta-fila">CAPÍTULO: <span>${c.capitulo || '---'}</span></div>
                    <div class="cita-meta-fila">PÁGINA: <span>${c.pagina || '---'}</span></div>
                    <div class="cita-meta-fila">AÑO: <span>${c.anio || '---'}</span></div>
                    <div style="margin-top:10px; display:flex; gap:6px;">
                        <button onclick="eliminarCita(${c.id})" class="btn-tabla-accion" style="background:#f87171; color:white; padding:4px 8px; border-radius:4px;">🗑️ Borrar</button>
                    </div>
                </div>
                <div class="cita-caja-texto" style="background-color: #b5e3fd;">
                    <div class="cita-badge-numero">${numLibreria}</div>
                    <blockquote>"${c.texto}"</blockquote>
                </div>
            </div>
        `;
    }).join('');

    let botonesPaginacion = "";
    if (totalPaginas > 1) {
        botonesPaginacion = `<div class="selector-anio" style="margin-top:25px;">`;
        for (let p = 1; p <= totalPaginas; p++) {
            botonesPaginacion += `<button class="btn-anio ${paginaActualCitas === p ? 'activo' : ''}" onclick="cambiarPaginaCitas(${p})">${p}</button>`;
        }
        botonesPaginacion += `</div>`;
    }

    contenido.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
            <h2 style="font-size:24px; font-weight:bold;">CITAS DE LECTURA</h2>
            ${botonesAccionCitas}
        </div>
        <div style="margin-bottom: 15px; font-size: 13px; color: #555;">Mostrando página ${paginaActualCitas} de ${totalPaginas} (Total de citas: ${totalCitas})[cite: 1]</div>
        <div class="contenedor-citas-planner">${htmlCitas}</div>
        ${botonesPaginacion}
    `;
}

function cambiarPaginaCitas(numPag) {
    paginaActualCitas = numPag;
    mostrarCitas();
}

function importarCitasCSV(event) {
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
            if (!dentroDeComillas) {
                filaActual.push(bufferCelda.trim());
                if (filaActual.length > 1 || filaActual[0] !== "") filas.push(filaActual);
                filaActual = [];
                bufferCelda = "";
            } else {
                bufferCelda += "\n";
            }
        }
        
        let count = 0;
        const inicioIndex = filas.length > 0 && filas[0][0].toLowerCase().includes("texto") ? 1 : 0;
        for (let i = inicioIndex; i < filas.length; i++) {
            const c = filas[i];
            if (c.length >= 2 && c[0]) {
                citas.push({
                    id: Date.now() + i,
                    texto: c[0].replace(/^"|"$/g, "").trim(),
                    libro: (c[1] || "").replace(/^"|"$/g, "").trim(),
                    autor: (c[2] || "").replace(/^"|"$/g, "").trim(),
                    capitulo: (c[3] || "").replace(/^"|"$/g, "").trim(),
                    pagina: (c[4] || "").replace(/^"|"$/g, "").trim(),
                    anio: (c[5] || "2026").replace(/^"|"$/g, "").trim()
                });
                count++;
            }
        }
        guardarEnLocalStorage();
        alert(`¡Se importaron ${count} citas correctamente!`);
        mostrarCitas();
    };
    lector.readAsText(archivo, 'UTF-8');
}

function eliminarCita(id) {
    if (confirm("¿Borrar esta cita?")) {
        citas = citas.filter(item => item.id !== id);
        guardarEnLocalStorage();
        mostrarCitas();
    }
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    mostrarPagina('inicio');
});
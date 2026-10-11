// --- BASE DE DATOS LOCAL (INICIALIZADA VACÍA) ---
let libros = JSON.parse(localStorage.getItem("libros")) || [];
let citas = JSON.parse(localStorage.getItem("citas")) || [];
let adaptaciones = JSON.parse(localStorage.getItem("adaptaciones")) || [];
let habitTrackerData = JSON.parse(localStorage.getItem("habitTrackerData")) || {};

// Año predeterminado al abrir la aplicación
let anioSeleccionado = 2026;

function guardarEnLocalStorage() {
    localStorage.setItem("libros", JSON.stringify(libros));
    localStorage.setItem("citas", JSON.stringify(citas));
    localStorage.setItem("adaptaciones", JSON.stringify(adaptaciones));
    localStorage.setItem("habitTrackerData", JSON.stringify(habitTrackerData));
}

function generarEstrellas(rating) {
    let s = "";
    for (let i = 1; i <= 5; i++) s += i <= rating ? "★" : "☆";
    return s;
}

function normalizarClase(t) {
    return t ? t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-") : "";
}

// --- GENERADOR DEL SELECTOR DE AÑOS (DESDE 2024 HASTA EL AÑO ACTUAL) ---
function obtenerSelectorAniosHTML(funcionCallback) {
    const anios = [2026, 2025, 2024];
    let html = `<div class="selector-anio">`;
    anios.forEach(a => {
        html += `<button class="btn-anio ${anioSeleccionado === a ? 'activo' : ''}" onclick="${funcionCallback}(${a})">${a}</button>`;
    });
    html += `</div>`;
    return html;
}

// --- NAVEGACIÓN PRINCIPAL ---
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
    else if (pagina === "citas") mostrarCitas();
    else if (pagina === "autores") mostrarAutores();
    else if (pagina === "registro") mostrarRegistro();
    else if (pagina === "adaptaciones") mostrarAdaptaciones();
    else if (pagina === "recap") mostrarRecapPorAnio();
}

// --- LIBRERÍA ---
function mostrarLibreria() {
    const contenido = document.getElementById("contenido");
    if (libros.length === 0) {
        contenido.innerHTML = `
            <h2 style="font-size:24px; font-weight:bold; margin-bottom:15px;">LIBRERÍA</h2>
            <p style="text-align:center; color:#666; margin-top:40px;">Tu librería está vacía. Ve a la sección de <strong>Registro</strong> para añadir tus lecturas.</p>
        `;
        return;
    }

    let tarjetas = "";
    libros.forEach((l, i) => {
        tarjetas += `
            <div class="tarjeta-libro" onclick="verResenaLibro(${l.id})">
                <div class="contenedor-portada"><span class="badge-numero">${l.numero || i+1}</span><img src="${l.portada}" onerror="this.src='images/libro-default.jpg'"></div>
                <div class="estrellas">${generarEstrellas(l.rating)}</div>
                <div class="linea-subrayado">${l.titulo}</div>
                <div style="font-size:13px; color:#555;">${l.autor}</div>
            </div>
        `;
    });
    contenido.innerHTML = `<h2 style="font-size:24px; font-weight:bold; margin-bottom:15px;">LIBRERÍA</h2><div class="lista-libros">${tarjetas}</div>`;
}

function verResenaLibro(id) {
    const l = libros.find(item => item.id === id);
    if (!l) return;
    document.getElementById("contenido").innerHTML = `
        <div class="vista-resena">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <button onclick="mostrarLibreria()" class="boton-volver">← Volver</button>
                <div class="resena-titulo-head">RESEÑA ${l.numero || 1}</div>
            </div>
            <div class="resena-contenido">
                <div class="columna-izquierda-resena">
                    <div class="contenedor-portada" style="width:160px; height:230px;"><img src="${l.portada}" onerror="this.src='images/libro-default.jpg'"></div>
                    <div class="estrellas" style="font-size:22px; margin-top:8px;">${generarEstrellas(l.rating)}</div>
                    <div class="linea-subrayado" style="text-align:center;">${l.titulo}</div>
                    <div style="font-size:13px; text-align:center; margin-bottom:10px;">${l.autor}</div>
                    <div class="caja-notas"><h4>NOTAS:</h4><ul>${(l.tropes || []).map(t=>`<li>${t}</li>`).join('') || '<li>Sin notas adicionales</li>'}</ul></div>
                </div>
                <div class="columna-derecha-resena">
                    <div class="texto-sinopsis">${l.sinopsis || "Sin opinión o sinopsis registrada."}</div>
                    <div class="metadatos-inferior">
                        <div class="metadatos-row"><span>PÁGINAS: ${l.paginas||'---'}</span><span>SAGA: ${l.saga||'Autoconclusivo'}</span></div>
                        <div class="metadatos-row"><span>INICIO: ${l.inicio||'---'}</span><span>FINAL: ${l.final||'---'}</span></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- ESTANTERÍA VIRTUAL ---
const paletaColoresPastel = ["#4fa8eb", "#7ed321", "#bd10e0", "#f5a623", "#50e3c2", "#e91e63", "#f8e71c", "#9013fe", "#4a90e2", "#b8e986", "#ff7675", "#fd79a8"];
function mostrarEstanterias() {
    const contenido = document.getElementById("contenido");
    const terminados = libros.filter(l => l.estado === "Leído" || l.estado === "Terminado");
    if (terminados.length === 0) { 
        contenido.innerHTML = `<h2>📖 Estantería Virtual</h2><p style="text-align:center; color:#666; margin-top:40px;">Aún no tienes libros registrados como terminados o leídos.</p>`; 
        return; 
    }
    
    const repisas = [[], [], [], []];
    terminados.forEach((l, i) => repisas[i % 4].push({ ...l, indexGlobal: i }));
    
    let htmlRepisas = "";
    repisas.forEach((librosRepisa) => {
        let contenidoRepisa = "";
        librosRepisa.forEach((l) => {
            const color = paletaColoresPastel[l.indexGlobal % paletaColoresPastel.length];
            contenidoRepisa += `<div class="libro-tomo" onclick="verResenaLibro(${l.id})" style="background-color: ${color}; height: 150px; width: 35px;" title="${l.titulo}"><span>${l.titulo}</span></div>`;
        });
        htmlRepisas += `<div class="repisa-madera">${contenidoRepisa}</div>`;
    });
    contenido.innerHTML = `<h2>ESTANTERÍA VIRTUAL</h2><div class="estanteria-contenedor">${htmlRepisas}</div>`;
}

// --- FAVORITO DEL MES ---
function mostrarFavoritosPorAnio(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    let htmlMeses = "";
    meses.forEach(mes => {
        const favs = libros.filter(l => (l.anio || 2026) === anioSeleccionado && (l.mes || "").toLowerCase() === mes && l.esFavoritoMes === true);

        let slot1 = favs.length > 0 ? `<div class="portada-slot" onclick="verResenaLibro(${favs[0].id})"><img src="${favs[0].portada}" onerror="this.parentElement.innerHTML='<span>${favs[0].titulo}</span>'"></div>` : `<div class="portada-slot"><span>+ Favorito 1</span></div>`;
        let slot2 = favs.length > 1 ? `<div class="portada-slot" onclick="verResenaLibro(${favs[1].id})"><img src="${favs[1].portada}" onerror="this.parentElement.innerHTML='<span>${favs[1].titulo}</span>'"></div>` : `<div class="portada-slot"><span>+ Favorito 2</span></div>`;

        htmlMeses += `<div class="tarjeta-mes-fav"><div class="nombre-mes-cursiva">${mes}</div><div class="slot-portadas">${slot1}${slot2}</div></div>`;
    });

    contenido.innerHTML = `
        <div class="contenedor-favoritos">
            <h2 style="text-align:center; margin-bottom:5px;">FAVORITO DEL MES (${anioSeleccionado})</h2>
            ${obtenerSelectorAniosHTML('mostrarFavoritosPorAnio')}
            <div class="grilla-favoritos-meses">${htmlMeses}</div>
        </div>
    `;
}

// --- RECAP MENSUAL ---
function mostrarRecapPorAnio(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    let htmlMeses = "";
    meses.forEach(mes => {
        const cant = libros.filter(l => (l.estado === "Leído" || l.estado === "Terminado") && (l.anio || 2026) === anioSeleccionado && (l.mes || "").toLowerCase() === mes).length;
        htmlMeses += `<div class="tarjeta-mes" onclick="mostrarDetalleRecapMes('${mes}', ${anioSeleccionado})"><h4 style="text-transform:capitalize; font-family:'Caveat',cursive; font-size:22px;">${mes}</h4><p>Leídos: <strong>${cant}</strong></p></div>`;
    });

    contenido.innerHTML = `<h2>📊 Recap Mensual</h2>${obtenerSelectorAniosHTML('mostrarRecapPorAnio')}<div class="grilla-meses">${htmlMeses}</div>`;
}

function mostrarDetalleRecapMes(mes, anio) {
    const contenido = document.getElementById("contenido");
    const librosMes = libros.filter(l => (l.anio || 2026) === anio && (l.mes || "").toLowerCase() === mes);
    const totalLeidosMes = librosMes.length;
    const totalPaginasMes = librosMes.reduce((t, l) => t + (Number(l.paginas) || 0), 0);

    const librosOrdenados = [...librosMes].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const libroMasGustado = librosOrdenados[0];
    const libroMenosGustado = librosOrdenados[librosOrdenados.length - 1];

    contenido.innerHTML = `
        <div class="recap-detalle-container">
            <button onclick="mostrarRecapPorAnio(${anio})" class="boton-volver">← Volver</button>
            <h2 style="font-family:'Caveat',cursive; font-size:36px; text-transform:capitalize; text-align:center; margin-bottom:15px;">${mes} ${anio}</h2>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                <div class="formulario-libro"><h4>Más gustado</h4>${libroMasGustado ? `<strong>${libroMasGustado.titulo}</strong><div>${generarEstrellas(libroMasGustado.rating)}</div>` : 'Sin registros'}</div>
                <div class="formulario-libro"><h4>Menos gustado</h4>${libroMenosGustado ? `<strong>${libroMenosGustado.titulo}</strong><div>${generarEstrellas(libroMenosGustado.rating)}</div>` : 'Sin registros'}</div>
            </div>
            <div class="estadisticas-anio-caja">
                <div class="stat-item"><span>Libros leídos</span><strong>${totalLeidosMes}</strong></div>
                <div class="stat-item"><span>Páginas leídas</span><strong>${totalPaginasMes}</strong></div>
            </div>
        </div>
    `;
}

// --- READING TRACKER ANUAL CON ILUSTRACIÓN MUSICAL ---
function obtenerClaseRangoPaginas(p) {
    if (p === undefined || p === null || p === "") return "rango-vacio";
    const num = Number(p);
    if (num <= 10) return "rango-0-10"; if (num <= 20) return "rango-11-20";
    if (num <= 30) return "rango-21-30"; if (num <= 40) return "rango-31-40";
    if (num <= 50) return "rango-41-50"; if (num <= 80) return "rango-51-80";
    if (num <= 100) return "rango-81-100"; return "rango-100-plus";
}

function mostrarTracker(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const mesesArray = [
        { nombre: "E", index: 0, dias: 31 }, { nombre: "F", index: 1, dias: (anio % 4 === 0 ? 29 : 28) },
        { nombre: "M", index: 2, dias: 31 }, { nombre: "A", index: 3, dias: 30 },
        { nombre: "M", index: 4, dias: 31 }, { nombre: "J", index: 5, dias: 30 },
        { nombre: "J", index: 6, dias: 31 }, { nombre: "A", index: 7, dias: 31 },
        { nombre: "S", index: 8, dias: 30 }, { nombre: "O", index: 9, dias: 31 },
        { nombre: "N", index: 10, dias: 30 }, { nombre: "D", index: 11, dias: 31 }
    ];

    let filasTabla = "";
    for (let dia = 1; dia <= 31; dia++) {
        let celdas = "";
        mesesArray.forEach(m => {
            if (dia > m.dias) celdas += `<td class="rango-invalido"></td>`;
            else {
                const k = `${anioSeleccionado}-${String(m.index + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                celdas += `<td class="celda-tracker ${obtenerClaseRangoPaginas(habitTrackerData[k])}" onclick="registrarPaginasDia('${k}', ${dia}, '${m.nombre}')"></td>`;
            }
        });
        filasTabla += `<tr><th style="font-size:10px;">${dia}</th>${celdas}</tr>`;
    }

    contenido.innerHTML = `
        <h2 style="text-align:center; margin-bottom:10px;">READING TRACKER (${anioSeleccionado})</h2>
        ${obtenerSelectorAniosHTML('mostrarTracker')}
        <div class="tracker-anual-container">
            <div class="tracker-tabla-wrapper">
                <table class="tabla-tracker-anual">
                    <thead><tr><th></th>${mesesArray.map(m=>`<th>${m.nombre}</th>`).join('')}</tr></thead>
                    <tbody>${filasTabla}</tbody>
                </table>
            </div>
            <div class="tracker-panel-derecho">
                <div class="tracker-leyenda-panel">
                    <h4>PÁGINAS</h4>
                    <div class="leyenda-item"><div class="leyenda-color-box rango-0-10"></div><span>0-10</span></div>
                    <div class="leyenda-item"><div class="leyenda-color-box rango-11-20"></div><span>11-20</span></div>
                    <div class="leyenda-item"><div class="leyenda-color-box rango-21-30"></div><span>21-30</span></div>
                    <div class="leyenda-item"><div class="leyenda-color-box rango-31-40"></div><span>31-40</span></div>
                    <div class="leyenda-item"><div class="leyenda-color-box rango-41-50"></div><span>41-50</span></div>
                    <div class="leyenda-item"><div class="leyenda-color-box rango-51-80"></div><span>51-80</span></div>
                    <div class="leyenda-item"><div class="leyenda-color-box rango-81-100"></div><span>81-100</span></div>
                    <div class="leyenda-item"><div class="leyenda-color-box rango-100-plus"></div><span>100+</span></div>
                </div>
                <div class="tracker-dibujo-musica">
                    <svg viewBox="0 0 140 180" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round">
                        <path d="M10 20 Q70 50 10 80 Q70 110 10 140" stroke-opacity="0.4" stroke-width="1.5"/>
                        <path d="M10 26 Q70 56 10 86 Q70 116 10 146" stroke-opacity="0.4" stroke-width="1.5"/>
                        <path d="M10 32 Q70 62 10 92 Q70 122 10 152" stroke-opacity="0.4" stroke-width="1.5"/>
                        <ellipse cx="45" cy="45" rx="7" ry="5" fill="#3b82f6" transform="rotate(-15 45 45)"/>
                        <path d="M51 43 V15" stroke-width="2.5"/>
                        <path d="M51 15 C65 12 75 22 78 30" fill="none" stroke-width="2.5"/>
                        <ellipse cx="90" cy="110" rx="7" ry="5" fill="#3b82f6" transform="rotate(-15 90 110)"/>
                        <path d="M96 108 V80" stroke-width="2.5"/>
                        <path d="M96 80 C110 77 120 87 123 95" fill="none" stroke-width="2.5"/>
                    </svg>
                    <p class="tracker-musica-label">Daily Reading</p>
                </div>
            </div>
        </div>
    `;
}

function registrarPaginasDia(k, d, m) {
    const val = prompt(`Páginas leídas el ${d} de ${m}:`, habitTrackerData[k] || "");
    if (val === null) return;
    if (val.trim() === "") delete habitTrackerData[k];
    else habitTrackerData[k] = Number(val);
    guardarEnLocalStorage();
    mostrarTracker(anioSeleccionado);
}

// --- CITAS ---
function mostrarCitas() {
    const contenido = document.getElementById("contenido");
    if (citas.length === 0) {
        contenido.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="font-size:24px; font-weight:bold;">CITAS</h2>
                <button onclick="mostrarFormularioCita()" class="boton-volver" style="margin:0;">+ Nueva cita</button>
            </div>
            <p style="text-align:center; color:#666; margin-top:40px;">No tienes citas guardadas todavía.</p>
        `;
        return;
    }

    let html = citas.map(c => `
        <div class="tarjeta-cita-planner">
            <div class="cita-metadatos">
                <div class="cita-meta-fila">LIBRO: <span>${c.libro || '---'}</span></div>
                <div class="cita-meta-fila">AUTOR/A: <span>${c.autor || '---'}</span></div>
                <div class="cita-meta-fila">CAPÍTULO: <span>${c.capitulo || '---'}</span></div>
                <div class="cita-meta-fila">PÁGINA: <span>${c.pagina || '---'}</span></div>
                <div class="cita-meta-fila">FECHA: <span>${c.fecha || '---'}</span></div>
            </div>
            <div class="cita-caja-texto">
                <div class="cita-badge-numero">${c.numero || 1}</div>
                <blockquote>${c.texto}</blockquote>
            </div>
        </div>
    `).join('');

    contenido.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h2 style="font-size:24px; font-weight:bold;">CITAS</h2><button onclick="mostrarFormularioCita()" class="boton-volver" style="margin:0;">+ Nueva cita</button></div><div class="contenedor-citas-planner">${html}</div>`;
}

function mostrarFormularioCita() {
    const hoy = new Date().toLocaleDateString('es-ES');
    document.getElementById("contenido").innerHTML = `
        <button onclick="mostrarCitas()" class="boton-volver">← Volver</button>
        <h2>💬 Nueva Cita</h2>
        <form id="form-cita" class="formulario-libro">
            <label>Cita / Fragmento</label><textarea id="t-cita" rows="5" required placeholder="Escribe el fragmento aquí..."></textarea>
            <label>Libro</label><input type="text" id="l-cita" required>
            <label>Autor/a</label><input type="text" id="a-cita">
            <label>Capítulo</label><input type="text" id="c-cita">
            <label>Página</label><input type="text" id="p-cita">
            <label>Fecha</label><input type="text" id="f-cita" value="${hoy}">
            <button type="submit">Guardar cita</button>
        </form>
    `;
    document.getElementById("form-cita").addEventListener("submit", (e) => {
        e.preventDefault();
        citas.push({
            id: Date.now(),
            numero: citas.length + 1,
            texto: document.getElementById("t-cita").value,
            libro: document.getElementById("l-cita").value,
            autor: document.getElementById("a-cita").value,
            capitulo: document.getElementById("c-cita").value,
            pagina: document.getElementById("p-cita").value,
            fecha: document.getElementById("f-cita").value
        });
        guardarEnLocalStorage();
        mostrarCitas();
    });
}

// --- AUTORES ---
function mostrarAutores() {
    const contenido = document.getElementById("contenido");
    let setA = new Set();
    libros.forEach(l => { if (l.autor && l.autor.trim()) setA.add(l.autor.trim()); });
    let lista = Array.from(setA).sort((a,b) => a.localeCompare(b));

    if (lista.length === 0) {
        contenido.innerHTML = `
            <div class="autores-index-container">
                <h2 style="text-align:center; font-size:26px; margin-bottom:5px;">AUTORES</h2>
                <div style="width:120px; height:2px; background:#4a77d4; margin:0 auto 20px auto;"></div>
                <p style="text-align:center; color:#666; margin-top:30px;">Aún no se han registrado libros con autores.</p>
            </div>
        `;
        return;
    }

    let botones = lista.map(a => `<button class="autor-btn-item" onclick="mostrarLibrosDeAutor('${a.replace(/'/g, "\\'")}')">${a}</button>`).join('');
    contenido.innerHTML = `<div class="autores-index-container"><h2 style="text-align:center; font-size:26px; margin-bottom:5px;">AUTORES</h2><div style="width:120px; height:2px; background:#4a77d4; margin:0 auto 20px auto;"></div><div class="autores-grid-3cols">${botones}</div></div>`;
}

function mostrarLibrosDeAutor(nombreAutor) {
    const contenido = document.getElementById("contenido");
    const librosAutor = libros.filter(l => l.autor && l.autor.trim().toLowerCase() === nombreAutor.toLowerCase());

    let tarjetas = librosAutor.map((l, i) => `
        <div class="tarjeta-libro" onclick="verResenaLibro(${l.id})">
            <div class="contenedor-portada"><span class="badge-numero">${l.numero || i+1}</span><img src="${l.portada}" onerror="this.src='images/libro-default.jpg'"></div>
            <div class="estrellas">${generarEstrellas(l.rating)}</div>
            <div class="linea-subrayado">${l.titulo}</div>
        </div>
    `).join('');

    contenido.innerHTML = `
        <div>
            <button onclick="mostrarAutores()" class="boton-volver">← Volver</button>
            <h2 style="text-align:center; margin-bottom:20px;">${nombreAutor}</h2>
            <div class="lista-libros">${tarjetas}</div>
        </div>
    `;
}

// --- REGISTRO Y TABLA ---
function mostrarRegistro(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const lAnio = libros.filter(l => (l.anio || 2026) === anioSeleccionado);
    const terminados = lAnio.filter(l => l.estado === "Leído" || l.estado === "Terminado").length;
    const paginas = lAnio.reduce((acc, l) => acc + (Number(l.paginas) || 0), 0);
    const pendientes = lAnio.filter(l => l.estado === "Por leer").length;
    const promedio = terminados > 0 ? (lAnio.reduce((acc, l) => acc + (l.rating || 0), 0) / terminados).toFixed(1) : 0;

    let filas = lAnio.map((l, i) => `<tr><td><b>${l.numero||i+1}</b></td><td><span class="badge-estado ${normalizarClase(l.estado)}">${l.estado}</span></td><td style="text-align:left;"><b>${l.titulo}</b></td><td style="text-align:left;">${l.autor}</td><td>${l.inicio||'---'}</td><td>${l.final||'---'}</td><td style="color:#fbc02d;">${generarEstrellas(l.rating)}</td></tr>`).join('') || `<tr><td colspan="7" style="padding:15px; color:#777;">Sin registros para el año ${anioSeleccionado}.</td></tr>`;

    contenido.innerHTML = `
        <div class="contenedor-registro-planner">
            <h2 style="text-align:center; margin-bottom:5px;">REGISTRO (${anioSeleccionado})</h2>
            ${obtenerSelectorAniosHTML('mostrarRegistro')}
            <div class="estadisticas-anio-caja">
                <div class="stat-item"><span>Terminados</span><strong>${terminados}</strong></div>
                <div class="stat-item"><span>Páginas</span><strong>${paginas}</strong></div>
                <div class="stat-item"><span>Pendientes</span><strong>${pendientes}</strong></div>
                <div class="stat-item"><span>Promedio ★</span><strong>${promedio}</strong></div>
            </div>
            <div style="overflow-x:auto;"><table class="tabla-registro-planner"><thead><tr><th>#</th><th>ESTADO</th><th>TÍTULO</th><th>AUTOR</th><th>INICIO</th><th>FINAL</th><th>PUNTAJE</th></tr></thead><tbody>${filas}</tbody></table></div>
            <div style="text-align:center;"><button onclick="mostrarFormularioNuevoLibro()" class="boton-volver" style="background:#5b9bd5; color:white; padding:10px 18px; font-weight:bold;">+ Registrar libro y reseña</button></div>
        </div>
    `;
}

function mostrarFormularioNuevoLibro() {
    document.getElementById("contenido").innerHTML = `
        <button onclick="mostrarRegistro(${anioSeleccionado})" class="boton-volver">← Volver</button>
        <h2>📝 Registrar Libro y Reseña Completa</h2>
        <form id="form-reg-completo" class="formulario-libro">
            <label>Título del libro</label><input type="text" id="reg-titulo" required>
            <label>Autor/a</label><input type="text" id="reg-autor" required>
            <label>Nº de Páginas</label><input type="number" id="reg-paginas">
            <label>Saga</label><input type="text" id="reg-saga" placeholder="Ej. Trilogía / Autoconclusivo">
            <label>Personajes principales</label><input type="text" id="reg-personajes">
            <div style="display:flex; gap:10px;">
                <div style="flex:1;"><label>Fecha Inicio</label><input type="text" id="reg-inicio" placeholder="DD/MM/YYYY"></div>
                <div style="flex:1;"><label>Fecha Final</label><input type="text" id="reg-final" placeholder="DD/MM/YYYY"></div>
            </div>
            <div style="display:flex; gap:10px;">
                <div style="flex:1;"><label>Año de lectura</label><input type="number" id="reg-anio" value="2026"></div>
                <div style="flex:1;">
                    <label>Mes de lectura</label>
                    <select id="reg-mes">
                        <option value="enero">Enero</option><option value="febrero">Febrero</option><option value="marzo">Marzo</option>
                        <option value="abril">Abril</option><option value="mayo">Mayo</option><option value="junio">Junio</option>
                        <option value="julio">Julio</option><option value="agosto">Agosto</option><option value="septiembre">Septiembre</option>
                        <option value="octubre">Octubre</option><option value="noviembre">Noviembre</option><option value="diciembre">Diciembre</option>
                    </select>
                </div>
            </div>
            <label>Sinopsis / Opinión (Amplio espacio)</label>
            <textarea id="reg-sinopsis" rows="7" placeholder="Escribe aquí la sinopsis completa o tu opinión..." style="resize:vertical; padding:10px;"></textarea>
            <label>Tropes / Notas (separados por coma)</label><input type="text" id="reg-tropes" placeholder="Ej. Slow burn, Boyfriend best friend">
            <label>¿Es favorito del mes?</label>
            <select id="reg-fav"><option value="false">No</option><option value="true">Sí</option></select>
            <label>Estado</label>
            <select id="reg-estado"><option value="Terminado">Terminado</option><option value="Leyendo">Leyendo</option><option value="Por leer">Por leer</option></select>
            <label>Calificación (Puntaje)</label>
            <select id="reg-rating"><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option><option value="2">★★</option><option value="1">★</option></select>
            <button type="submit" style="margin-top:10px;">Guardar libro y reseña</button>
        </form>
    `;

    document.getElementById("form-reg-completo").addEventListener("submit", (e) => {
        e.preventDefault();
        const tropesArr = document.getElementById("reg-tropes").value.split(",").map(t => t.trim()).filter(t => t.length > 0);
        
        const nuevoLibro = {
            id: Date.now(),
            numero: libros.length + 1,
            titulo: document.getElementById("reg-titulo").value,
            autor: document.getElementById("reg-autor").value,
            paginas: Number(document.getElementById("reg-paginas").value) || 0,
            saga: document.getElementById("reg-saga").value,
            personajes: document.getElementById("reg-personajes").value,
            inicio: document.getElementById("reg-inicio").value,
            final: document.getElementById("reg-final").value,
            sinopsis: document.getElementById("reg-sinopsis").value,
            tropes: tropesArr,
            anio: Number(document.getElementById("reg-anio").value),
            mes: document.getElementById("reg-mes").value,
            esFavoritoMes: document.getElementById("reg-fav").value === "true",
            estado: document.getElementById("reg-estado").value,
            rating: Number(document.getElementById("reg-rating").value),
            portada: "images/libro-default.jpg"
        };

        libros.push(nuevoLibro);
        guardarEnLocalStorage();
        alert("¡Libro y reseña guardados correctamente!");
        mostrarRegistro(nuevoLibro.anio);
    });
}

// --- ADAPTACIONES ---
function mostrarAdaptaciones() {
    const contenido = document.getElementById("contenido");
    if (adaptaciones.length === 0) {
        contenido.innerHTML = `
            <div class="autores-index-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h2 style="font-size:26px; margin:0;">ADAPTACIONES</h2>
                    <button onclick="mostrarFormularioAdaptacion()" class="boton-volver" style="margin:0;">+ Nueva adaptación</button>
                </div>
                <div style="width:120px; height:2px; background:#4a77d4; margin:0 auto 20px auto;"></div>
                <p style="text-align:center; color:#666; margin-top:30px;">Aún no tienes adaptaciones registradas.</p>
            </div>
        `;
        return;
    }

    let botonesHTML = adaptaciones.map(ad => `<button class="autor-btn-item" onclick="verDetalleAdaptacion(${ad.id})">${ad.titulo}</button>`).join('');
    contenido.innerHTML = `
        <div class="autores-index-container">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="font-size:26px; margin:0;">ADAPTACIONES</h2>
                <button onclick="mostrarFormularioAdaptacion()" class="boton-volver" style="margin:0;">+ Nueva adaptación</button>
            </div>
            <div style="width:120px; height:2px; background:#4a77d4; margin:0 auto 20px auto;"></div>
            <div class="autores-grid-3cols">${botonesHTML}</div>
        </div>
    `;
}

function verDetalleAdaptacion(id) {
    const ad = adaptaciones.find(item => item.id === id);
    if (!ad) return;

    document.getElementById("contenido").innerHTML = `
        <div>
            <button onclick="mostrarAdaptaciones()" class="boton-volver">← Volver</button>
            <div class="adaptacion-card-detalle">
                <h2 style="text-align:center; margin-bottom:20px;">${ad.titulo}</h2>
                <div class="adaptacion-grid-comparativa">
                    <div class="adaptacion-columna-media">
                        <img src="${ad.posterPelicula}" class="adaptacion-poster" onerror="this.src='images/libro-default.jpg'">
                        <div class="adaptacion-estrellas-fila">${generarEstrellas(ad.ratingPelicula)}</div>
                        <div class="adaptacion-info-detalles">
                            <div class="adaptacion-info-fila">AÑO: <span>${ad.anioPelicula || '---'}</span></div>
                            <div class="adaptacion-info-fila">PLATAFORMA: <span>${ad.plataforma || '---'}</span></div>
                        </div>
                    </div>
                    <div class="adaptacion-divisor-vertical"></div>
                    <div class="adaptacion-columna-media">
                        <img src="${ad.portadaLibro}" class="adaptacion-poster" onerror="this.src='images/libro-default.jpg'">
                        <div class="adaptacion-estrellas-fila">${generarEstrellas(ad.ratingLibro)}</div>
                        <div class="adaptacion-info-detalles">
                            <div class="adaptacion-info-fila">AÑO: <span>${ad.anioLibro || '---'}</span></div>
                            <div class="adaptacion-info-fila">AUTOR/A: <span>${ad.autor || '---'}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function mostrarFormularioAdaptacion() {
    document.getElementById("contenido").innerHTML = `
        <button onclick="mostrarAdaptaciones()" class="boton-volver">← Volver</button>
        <h2>🎬 Nueva Adaptación</h2>
        <form id="form-adapt" class="formulario-libro">
            <label>Título de la obra</label><input type="text" id="ad-titulo" required>
            <label>Autor/a del libro</label><input type="text" id="ad-autor">
            <label>Año del libro</label><input type="number" id="ad-anil">
            <label>Año de la película / serie</label><input type="number" id="ad-anip">
            <label>Plataforma (Cine, Netflix, etc.)</label><input type="text" id="ad-plat">
            <button type="submit">Guardar adaptación</button>
        </form>
    `;
    document.getElementById("form-adapt").addEventListener("submit", (e) => {
        e.preventDefault();
        adaptaciones.push({
            id: Date.now(),
            titulo: document.getElementById("ad-titulo").value,
            autor: document.getElementById("ad-autor").value,
            anioLibro: Number(document.getElementById("ad-anil").value),
            anioPelicula: Number(document.getElementById("ad-anip").value),
            plataforma: document.getElementById("ad-plat").value,
            ratingLibro: 4, ratingPelicula: 5,
            portadaLibro: "images/libro-default.jpg", posterPelicula: "images/libro-default.jpg"
        });
        guardarEnLocalStorage();
        mostrarAdaptaciones();
    });
}

// Carga inicial al abrir la app
window.onload = () => { mostrarPagina('inicio'); };
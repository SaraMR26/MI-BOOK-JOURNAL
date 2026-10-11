let libros = JSON.parse(localStorage.getItem("libros")) || [
    {
        id: 1, numero: 1, titulo: "Un día de Diciembre", autor: "Josie Silver", paginas: 302,
        saga: "Autoconclusivo", publicacion: "10/10/2019", inicio: "26/07/2021", final: "16/08/2021",
        personajes: "Laurie y Jack", estado: "Leído", rating: 4, genero: "Romance", anio: 2026, mes: "agosto",
        esFavoritoMes: true, sinopsis: "Laurie no cree en el amor a primera vista...", tropes: ["Slow burn"], portada: "images/libro-default.jpg"
    }
];

let citas = JSON.parse(localStorage.getItem("citas")) || [
    { id: 1, numero: 1, texto: "—No me esperes, Ginger. Cuatro palabras que se me clavaron...", libro: "Nosotros en la Luna", autor: "Alice Kellen", capitulo: "33", pagina: "154", fecha: "30/05/2022" }
];

let adaptaciones = JSON.parse(localStorage.getItem("adaptaciones")) || [
    { id: 1, titulo: "A dos metros de ti", autor: "Rachael Lippincott", anioLibro: 2014, ratingLibro: 4, anioPelicula: 2019, plataforma: "Netflix", ratingPelicula: 5, portadaLibro: "images/libro-default.jpg", posterPelicula: "images/libro-default.jpg" }
];

let habitTrackerData = JSON.parse(localStorage.getItem("habitTrackerData")) || {};
let fechaTracker = new Date();
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
    return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
}

function mostrarPagina(pagina) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if(btn.getAttribute('data-tab') === pagina) btn.classList.add('active');
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

function mostrarLibreria() {
    const contenido = document.getElementById("contenido");
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
                    <div class="caja-notas"><h4>NOTAS:</h4><ul>${(l.tropes || []).map(t=>`<li>${t}</li>`).join('') || '<li>Puntos clave</li>'}</ul></div>
                </div>
                <div class="columna-derecha-resena">
                    <div class="texto-sinopsis">${l.sinopsis || "Sinopsis..."}</div>
                    <div class="metadatos-inferior">
                        <div class="metadatos-row"><span>PÁGINAS: ${l.paginas||'---'}</span><span>SAGA: ${l.saga||'Autoconclusivo'}</span></div>
                        <div class="metadatos-row"><span>INICIO: ${l.inicio||'---'}</span><span>FINAL: ${l.final||'---'}</span></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

const paletaColoresPastel = ["#4fa8eb", "#7ed321", "#bd10e0", "#f5a623", "#50e3c2", "#e91e63", "#f8e71c", "#9013fe", "#4a90e2", "#b8e986", "#ff7675", "#fd79a8"];
function mostrarEstanterias() {
    const contenido = document.getElementById("contenido");
    const terminados = libros.filter(l => l.estado === "Leído" || l.estado === "Terminado");
    if (terminados.length === 0) { contenido.innerHTML = `<h2>📖 Estantería</h2><p style="text-align:center; margin-top:20px;">No hay libros terminados.</p>`; return; }
    
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

// --- FAVORITO DEL MES CON CLIC A RESEÑA ---
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
            <div class="selector-anio">
                <button class="btn-anio ${anioSeleccionado === 2026 ? 'activo' : ''}" onclick="mostrarFavoritosPorAnio(2026)">2026</button>
                <button class="btn-anio ${anioSeleccionado === 2025 ? 'activo' : ''}" onclick="mostrarFavoritosPorAnio(2025)">2025</button>
            </div>
            <div class="grilla-favoritos-meses">${htmlMeses}</div>
        </div>
    `;
}

function mostrarRecapPorAnio(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    let htmlMeses = "";
    meses.forEach(mes => {
        const cant = libros.filter(l => l.estado === "Leído" && (l.anio || 2026) === anioSeleccionado && (l.mes || "").toLowerCase() === mes).length;
        htmlMeses += `<div class="tarjeta-mes" onclick="alert('Resumen de ${mes}')"><h4 style="text-transform:capitalize; font-family:'Caveat',cursive; font-size:22px;">${mes}</h4><p>Leídos: <strong>${cant}</strong></p></div>`;
    });

    contenido.innerHTML = `<h2>📊 Recap Mensual</h2><div class="selector-anio"><button class="btn-anio ${anioSeleccionado === 2026 ? 'activo' : ''}" onclick="mostrarRecapPorAnio(2026)">2026</button><button class="btn-anio ${anioSeleccionado === 2025 ? 'activo' : ''}" onclick="mostrarRecapPorAnio(2025)">2025</button></div><div class="grilla-meses">${htmlMeses}</div>`;
}

// --- READING TRACKER CON DIBUJO DE MÚSICA ---
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
        { nombre: "E", index: 0, dias: 31 }, { nombre: "F", index: 1, dias: 28 },
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
        <div class="selector-anio"><button class="btn-anio ${anioSeleccionado===2026?'activo':''}" onclick="mostrarTracker(2026)">2026</button><button class="btn-anio ${anioSeleccionado===2025?'activo':''}" onclick="mostrarTracker(2025)">2025</button></div>
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
                    <svg viewBox="0 0 100 140" fill="none" stroke="#2c3e50" stroke-width="2">
                        <path d="M20 10 Q50 40 20 70 Q50 100 20 130" />
                        <circle cx="20" cy="40" r="6" fill="#2c3e50"/>
                        <circle cx="20" cy="100" r="6" fill="#2c3e50"/>
                        <path d="M26 40 V15 H40 V20" />
                    </svg>
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

// --- CITAS AMPLIADAS EN AZUL CLARO ---
function mostrarCitas() {
    const contenido = document.getElementById("contenido");
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

    contenido.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;"><h2 style="font-size:24px; font-weight:bold;">CITAS</h2><button onclick="mostrarFormularioCita()" class="boton-volver" style="margin:0;">+ Nueva cita</button></div><div class="contenedor-citas-planner">${html || '<p>Sin citas.</p>'}</div>`;
}

function mostrarFormularioCita() {
    document.getElementById("contenido").innerHTML = `
        <h2>💬 Nueva cita</h2>
        <form id="form-cita" class="formulario-libro">
            <label>Cita</label><textarea id="t-cita" rows="5" required></textarea>
            <label>Libro</label><input type="text" id="l-cita" required>
            <label>Autor</label><input type="text" id="a-cita">
            <label>Página</label><input type="text" id="p-cita">
            <button type="submit">Guardar cita</button>
        </form>
    `;
    document.getElementById("form-cita").addEventListener("submit", (e) => {
        e.preventDefault();
        citas.push({ id: Date.now(), numero: citas.length + 1, texto: document.getElementById("t-cita").value, libro: document.getElementById("l-cita").value, autor: document.getElementById("a-cita").value, pagina: document.getElementById("p-cita").value, fecha: "10 de octubre de 2026" });
        guardarEnLocalStorage();
        mostrarCitas();
    });
}

function mostrarAutores() {
    const contenido = document.getElementById("contenido");
    let setA = new Set();
    libros.forEach(l => { if (l.autor) setA.add(l.autor.trim()); });
    let lista = Array.from(setA).sort();
    contenido.innerHTML = `<div class="autores-index-container"><h2 style="text-align:center; font-size:26px; margin-bottom:5px;">AUTORES</h2><div class="autores-grid-3cols">${lista.map(a=>`<button class="autor-btn-item" onclick="alert('${a}')">${a}</button>`).join('')}</div></div>`;
}

// --- REGISTRO CON MÁS ESTADÍSTICAS ---
function mostrarRegistro(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const lAnio = libros.filter(l => (l.anio || 2026) === anioSeleccionado);
    const terminados = lAnio.filter(l => l.estado === "Leído" || l.estado === "Terminado").length;
    const paginas = lAnio.reduce((acc, l) => acc + (Number(l.paginas) || 0), 0);
    const pendientes = lAnio.filter(l => l.estado === "Por leer").length;
    const promedio = terminados > 0 ? (lAnio.reduce((acc, l) => acc + (l.rating || 0), 0) / terminados).toFixed(1) : 0;

    let filas = lAnio.map((l, i) => `<tr><td><b>${l.numero||i+1}</b></td><td><span class="badge-estado ${normalizarClase(l.estado)}">${l.estado}</span></td><td style="text-align:left;"><b>${l.titulo}</b></td><td style="text-align:left;">${l.autor}</td><td>${l.inicio||'---'}</td><td>${l.final||'---'}</td><td style="color:#fbc02d;">${generarEstrellas(l.rating)}</td></tr>`).join('') || `<tr><td colspan="7">Sin registros.</td></tr>`;

    contenido.innerHTML = `
        <div class="contenedor-registro-planner">
            <h2 style="text-align:center; margin-bottom:5px;">REGISTRO (${anioSeleccionado})</h2>
            <div class="selector-anio"><button class="btn-anio ${anioSeleccionado===2026?'activo':''}" onclick="mostrarRegistro(2026)">2026</button><button class="btn-anio ${anioSeleccionado===2025?'activo':''}" onclick="mostrarRegistro(2025)">2025</button></div>
            <div class="estadisticas-anio-caja">
                <div class="stat-item"><span>Terminados</span><strong>${terminados}</strong></div>
                <div class="stat-item"><span>Páginas</span><strong>${paginas}</strong></div>
                <div class="stat-item"><span>Pendientes</span><strong>${pendientes}</strong></div>
                <div class="stat-item"><span>Promedio ★</span><strong>${promedio}</strong></div>
            </div>
            <div style="overflow-x:auto;"><table class="tabla-registro-planner"><thead><tr><th>#</th><th>ESTADO</th><th>TÍTULO</th><th>AUTOR</th><th>INICIO</th><th>FINAL</th><th>PUNTAJE</th></tr></thead><tbody>${filas}</tbody></table></div>
            <div style="text-align:center;"><button onclick="alert('Formulario')" class="boton-volver" style="background:#5b9bd5; color:white; padding:10px;">+ Registrar libro</button></div>
        </div>
    `;
}

function mostrarAdaptaciones() {
    document.getElementById("contenido").innerHTML = `<div class="autores-index-container"><h2 style="text-align:center;">ADAPTACIONES</h2><div class="autores-grid-3cols">${adaptaciones.map(ad=>`<button class="autor-btn-item">${ad.titulo}</button>`).join('')}</div></div>`;
}

window.onload = () => { mostrarPagina('inicio'); };
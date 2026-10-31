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
const citasPorPagina = 10; // Citas que se muestran por página

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

function generarEstrellasGrandes(rating, inactivo = false) {
    let s = "";
    const num = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
        s += i <= num ? "★" : "☆";
    }
    const colorEstilo = inactivo ? "color: #e53e3e !important;" : "color: #f39c12 !important;";
    return `<span style="${colorEstilo} font-size:24px; letter-spacing:2px;">${s}</span>`;
}

function normalizarClase(t) {
    return t ? t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-") : "";
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

// --- LIBRERÍA ---
function mostrarLibreria() {
    const contenido = document.getElementById("contenido");
    if (libros.length === 0) {
        contenido.innerHTML = `<h2 style="font-size:24px; font-weight:bold; margin-bottom:15px;">LIBRERÍA</h2><p style="text-align:center; color:#666; margin-top:40px;">Tu librería está vacía. Registra libros en <strong>Registro</strong> o <strong>Próximos</strong>.</p>`;
        return;
    }

    let tarjetas = "";
    libros.forEach((l, i) => {
        const num = l.numero || (i + 1);
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
    contenido.innerHTML = `<h2 style="font-size:24px; font-weight:bold; margin-bottom:15px;">LIBRERÍA</h2><div class="lista-libros">${tarjetas}</div>`;
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
                    <button onclick="editarLibro(${l.id})" class="boton-volver" style="background:#fef08a; margin-right:6px;">✏️ Editar</button>
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

// --- LIBROS PRÓXIMOS ---
function mostrarProximos() {
    const contenido = document.getElementById("contenido");
    const proximos = libros.filter(l => l.estado === "Próximo" || l.estado === "Por leer");

    let tarjetas = "";
    if (proximos.length === 0) {
        tarjetas = `<p style="text-align:center; color:#666; margin-top:30px; grid-column: span 3;">No tienes libros próximos.</p>`;
    } else {
        proximos.forEach((l) => {
            const idiomaClase = (l.idioma || "Español").toLowerCase().includes("ing") ? "ingles" : "espanol";
            tarjetas += `
                <div class="tarjeta-libro" style="cursor:default;">
                    <div class="contenedor-portada">
                        <span class="badge-numero">${l.numero || '#'}</span>
                        <img src="${l.portada}" onerror="this.src='imagenes/libro-default.jpg'">
                    </div>
                    <div class="linea-subrayado ${idiomaClase}">${l.titulo}</div>
                    <div style="font-size:13px; color:#555; margin-bottom:4px;">${l.autor}</div>
                    <span class="badge-idioma ${idiomaClase}" style="margin-bottom:8px;">${l.idioma || 'Español'}</span>
                    <div>
                        <button onclick="marcarComoTerminado(${l.id})" class="btn-tabla-accion" title="Marcar Terminado" style="background:#a3e4d7;">✅ Leído</button>
                        <button onclick="editarLibro(${l.id})" class="btn-tabla-accion" title="Editar">✏️</button>
                        <button onclick="eliminarLibro(${l.id})" class="btn-tabla-accion" title="Borrar">🗑️</button>
                    </div>
                </div>
            `;
        });
    }

    contenido.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2>⏳ Libros Próximos (TBR)</h2>
            <button onclick="mostrarFormularioNuevoLibro('Próximo')" class="boton-volver" style="background:#5b9bd5; color:white;">+ Añadir Próximo</button>
        </div>
        <div class="lista-libros">${tarjetas}</div>
    `;
}

function marcarComoTerminado(id) {
    const l = libros.find(item => item.id === id);
    if (!l) return;
    if (confirm(`¿Marcar "${l.titulo}" como Terminado?`)) {
        l.estado = "Terminado";
        guardarEnLocalStorage();
        mostrarProximos();
    }
}

// --- METAS ---
function mostrarMetas() {
    const contenido = document.getElementById("contenido");
    const totalLeidosAnio = libros.filter(l => (l.estado === "Terminado" || l.estado === "Leído") && (l.anio || 2026) === anioSeleccionado).length;
    const totalPaginasAnio = libros.filter(l => (l.estado === "Terminado" || l.estado === "Leído") && (l.anio || 2026) === anioSeleccionado).reduce((acc, l) => acc + (Number(l.paginas) || 0), 0);

    let htmlMetas = metas.map(m => {
        let actual = m.actual;
        if (m.titulo.toLowerCase().includes("libro")) actual = totalLeidosAnio;
        if (m.titulo.toLowerCase().includes("páginas") || m.titulo.toLowerCase().includes("paginas")) actual = totalPaginasAnio;
        const porcentaje = Math.min(100, Math.round((actual / m.objetivo) * 100));
        const completada = actual >= m.objetivo || m.completada;

        return `
            <div class="meta-item-card">
                <input type="checkbox" class="meta-checkbox" ${completada ? 'checked' : ''} onchange="toggleMeta(${m.id})">
                <div class="meta-info">
                    <div class="meta-titulo">${m.titulo} (${actual} / ${m.objetivo})</div>
                    <div class="meta-progreso-bar"><div class="meta-progreso-fill" style="width: ${porcentaje}%;"></div></div>
                </div>
                <button onclick="eliminarMeta(${m.id})" class="btn-tabla-accion">🗑️</button>
            </div>
        `;
    }).join('');

    contenido.innerHTML = `
        <div class="contenedor-metas">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2>🎯 Lista de Metas de Lectura</h2>
                <button onclick="mostrarFormularioMeta()" class="boton-volver" style="background:#5b9bd5; color:white;">+ Nueva Meta</button>
            </div>
            ${htmlMetas || '<p style="text-align:center;">No tienes metas establecidas.</p>'}
        </div>
    `;
}

function toggleMeta(id) {
    const m = metas.find(item => item.id === id);
    if (m) { m.completada = !m.completada; guardarEnLocalStorage(); mostrarMetas(); }
}

function eliminarMeta(id) {
    if (confirm("¿Borrar esta meta?")) { metas = metas.filter(item => item.id !== id); guardarEnLocalStorage(); mostrarMetas(); }
}

function mostrarFormularioMeta() {
    document.getElementById("contenido").innerHTML = `
        <button onclick="mostrarMetas()" class="boton-volver">← Volver</button>
        <h2>🎯 Nueva Meta</h2>
        <form id="form-meta" class="formulario-libro">
            <label>Descripción de la meta</label><input type="text" id="m-titulo" required placeholder="Ej. Leer 12 libros">
            <label>Objetivo numérico</label><input type="number" id="m-objetivo" required value="10">
            <button type="submit">Guardar Meta</button>
        </form>
    `;
    document.getElementById("form-meta").addEventListener("submit", (e) => {
        e.preventDefault();
        metas.push({ id: Date.now(), titulo: document.getElementById("m-titulo").value, objetivo: Number(document.getElementById("m-objetivo").value), actual: 0, completada: false });
        guardarEnLocalStorage();
        mostrarMetas();
    });
}

// --- ESTANTERÍA VIRTUAL ---
const paletaColoresPastel = ["#4fa8eb", "#7ed321", "#bd10e0", "#f5a623", "#50e3c2", "#e91e63", "#f8e71c", "#9013fe", "#4a90e2", "#b8e986", "#ff7675", "#fd79a8"];
function mostrarEstanterias() {
    const contenido = document.getElementById("contenido");
    const terminados = libros.filter(l => l.estado === "Leído" || l.estado === "Terminado");
    if (terminados.length === 0) { contenido.innerHTML = `<h2>📖 Estantería Virtual</h2><p style="text-align:center; color:#666; margin-top:40px;">No hay libros terminados.</p>`; return; }
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
    contenido.innerHTML = `<div class="contenedor-favoritos"><h2 style="text-align:center; margin-bottom:5px;">FAVORITO DEL MES (${anioSeleccionado})</h2>${obtenerSelectorAniosHTML('mostrarFavoritosPorAnio')}<div class="grilla-favoritos-meses">${htmlMeses}</div></div>`;
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
    const librosMes = libros.filter(l => (l.estado === "Leído" || l.estado === "Terminado") && (l.anio || 2026) === anio && (l.mes || "").toLowerCase() === mes);
    const totalLeidosMes = librosMes.length;
    const totalPaginasMes = librosMes.reduce((t, l) => t + (Number(l.paginas) || 0), 0);
    const librosOrdenados = [...librosMes].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const libroMasGustado = librosOrdenados[0];
    const libroMenosGustado = librosOrdenados[librosOrdenados.length - 1];
    const top3 = librosOrdenados.slice(0, 3);

    let top3Html = top3.map(l => `
        <div class="recap-top3-card">
            <img src="${l.portada}" onerror="this.src='imagenes/libro-default.jpg'">
            <strong>${l.titulo}</strong>
            <div class="estrellas">${generarEstrellas(l.rating)}</div>
        </div>
    `).join('') || '<p style="text-align:center; color:#777;">No hay lecturas registradas este mes.</p>';

    contenido.innerHTML = `
        <div class="recap-detalle-container">
            <button onclick="mostrarRecapPorAnio(${anio})" class="boton-volver">← Volver al Recap</button>
            <h2 style="font-family:'Caveat',cursive; font-size:36px; text-transform:capitalize; text-align:center; margin-bottom:15px;">${mes} ${anio}</h2>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                <div class="formulario-libro"><h4>Más gustado</h4>${libroMasGustado ? `<strong>${libroMasGustado.titulo}</strong><div class="estrellas">${generarEstrellas(libroMasGustado.rating)}</div>` : 'Sin registros'}</div>
                <div class="formulario-libro"><h4>Menos gustado</h4>${libroMenosGustado ? `<strong>${libroMenosGustado.titulo}</strong><div class="estrellas">${generarEstrellas(libroMenosGustado.rating)}</div>` : 'Sin registros'}</div>
            </div>
            <h3 style="text-align:center; font-size:18px; margin-top:20px;">Top 3 Mejores Lecturas</h3>
            <div class="recap-top3-contenedor">${top3Html}</div>
            <div class="recap-stats-centradas">
                <div class="recap-circulo-stat"><span>Nº de libros leídos</span><div class="recap-circulo-badge">${totalLeidosMes}</div></div>
                <div class="recap-circulo-stat"><span>Nº de páginas leídas</span><div class="recap-circulo-badge" style="width:80px; height:80px; font-size:16px;">${totalPaginasMes}</div></div>
            </div>
        </div>
    `;
}

// --- READING TRACKER ---
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
    const mesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    let encabezadosMeses = mesesNombres.map(m => `<th class="th-mes"><div class="th-mes-texto">${m}</div></th>`).join('');
    let filasTabla = "";
    for (let dia = 1; dia <= 31; dia++) {
        let celdas = "";
        mesesNombres.forEach((m, idx) => {
            const diasEnMes = new Date(anioSeleccionado, idx + 1, 0).getDate();
            if (dia > diasEnMes) { celdas += `<td class="rango-invalido"></td>`; } 
            else {
                const k = `${anioSeleccionado}-${String(idx + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                celdas += `<td class="celda-tracker ${obtenerClaseRangoPaginas(habitTrackerData[k])}" onclick="registrarPaginasDia('${k}', ${dia}, '${m}')"></td>`;
            }
        });
        filasTabla += `<tr><th style="font-size:10px;">${dia}</th>${celdas}</tr>`;
    }
    contenido.innerHTML = `
        <h2 style="text-align:center; margin-bottom:10px;">READING TRACKER (${anioSeleccionado})</h2>
        ${obtenerSelectorAniosHTML('mostrarTracker')}
        <div class="tracker-anual-container">
            <div class="tracker-tabla-wrapper">
                <table class="tabla-tracker-anual"><thead><tr><th></th>${encabezadosMeses}</tr></thead><tbody>${filasTabla}</tbody></table>
            </div>
            <div class="tracker-leyenda-horizontal">
                <div class="leyenda-item"><div class="leyenda-color-box rango-0-10"></div><span>0-10</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-11-20"></div><span>11-20</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-21-30"></div><span>21-30</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-31-40"></div><span>31-40</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-41-50"></div><span>41-50</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-51-80"></div><span>51-80</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-81-100"></div><span>81-100</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-100-plus"></div><span>100+</span></div>
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

// --- CITAS (CON PAGINACIÓN Y LECTOR CSV INFALIBLE PARA COMAS Y SALTOS DE LÍNEA) ---
const mapaColoresAnio = {
    2026: "#b5e3fd", 2025: "#ffd1dc", 2024: "#e2f0cb", 2023: "#d8b4f8", 2022: "#ffffba", 2021: "#ffdfba"
};

function mostrarCitas() {
    const contenido = document.getElementById("contenido");

    const totalCitas = citas.length;
    const autorMap = {};
    const libroMap = {};
    const anioMap = {};

    citas.forEach(c => {
        if (c.autor) autorMap[c.autor] = (autorMap[c.autor] || 0) + 1;
        if (c.libro) libroMap[c.libro] = (libroMap[c.libro] || 0) + 1;
        if (c.anio) anioMap[c.anio] = (anioMap[c.anio] || 0) + 1;
    });

    const obtenerTop = (mapa) => {
        let max = 0, res = "---";
        for (let k in mapa) { if (mapa[k] > max) { max = mapa[k]; res = k; } }
        return res;
    };

    const topAutor = obtenerTop(autorMap);
    const topLibro = obtenerTop(libroMap);
    const topAnio = obtenerTop(anioMap);

    const botonesAccionCitas = `
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button onclick="mostrarFormularioCita()" class="boton-volver" style="background:#5b9bd5; color:white; margin:0;">+ Nueva Cita</button>
            <input type="file" id="input-csv-citas" accept=".csv" style="display:none" onchange="importarCitasCSV(event)">
            <button onclick="document.getElementById('input-csv-citas').click()" class="boton-volver" style="background:#48bb78; color:white; margin:0;">📂 CSV</button>
            <button onclick="vaciarCitas()" class="boton-volver" style="background:#f87171; color:white; margin:0;">🗑️ Vaciar</button>
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

    // Paginación de citas
    const totalPaginas = Math.ceil(citas.length / citasPorPagina);
    if (paginaActualCitas > totalPaginas) paginaActualCitas = totalPaginas;
    if (paginaActualCitas < 1) paginaActualCitas = 1;

    const inicioSlice = (paginaActualCitas - 1) * citasPorPagina;
    const finSlice = inicioSlice + citasPorPagina;
    const citasPaginadas = citas.slice(inicioSlice, finSlice);

    let htmlCitas = citasPaginadas.map(c => {
        const colorFondo = mapaColoresAnio[c.anio] || "#b5e3fd";
        const numLibreria = obtenerNumeroLibroEnLibreria(c.libro);

        return `
            <div class="tarjeta-cita-planner">
                <div class="cita-metadatos">
                    <div class="cita-meta-fila">LIBRO: <span>${c.libro || '---'}</span></div>
                    <div class="cita-meta-fila">AUTOR/A: <span>${c.autor || '---'}</span></div>
                    <div class="cita-meta-fila">CAPÍTULO: <span>${c.capitulo || '---'}</span></div>
                    <div class="cita-meta-fila">PÁGINA: <span>${c.pagina || '---'}</span></div>
                    <div class="cita-meta-fila">AÑO: <span>${c.anio || '---'}</span></div>
                    <div class="cita-meta-fila">FECHA: <span>${c.fecha || '---'}</span></div>
                    <div style="margin-top:10px; display:flex; gap:6px;">
                        <button onclick="editarCita(${c.id})" class="btn-tabla-accion" style="background:#fef08a; padding:4px 8px; border-radius:4px;">✏️ Editar</button>
                        <button onclick="eliminarCita(${c.id})" class="btn-tabla-accion" style="background:#f87171; color:white; padding:4px 8px; border-radius:4px;">🗑️ Borrar</button>
                    </div>
                </div>
                <div class="cita-caja-texto" style="background-color: ${colorFondo};">
                    <div class="cita-badge-numero">${numLibreria}</div>
                    <blockquote>"${c.texto}"</blockquote>
                </div>
            </div>
        `;
    }).join('');

    // Generar botones de paginación
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

        <div class="panel-destacados-grid" style="margin-bottom:25px;">
            <div class="card-destacado"><span>Total Citas</span><strong>${totalCitas}</strong></div>
            <div class="card-destacado"><span>Autora Top</span><strong>${topAutor}</strong></div>
            <div class="card-destacado"><span>Libro Top</span><strong>${topLibro}</strong></div>
            <div class="card-destacado"><span>Año Top</span><strong>${topAnio}</strong></div>
        </div>

        <div class="contenedor-citas-planner">${htmlCitas}</div>
        ${botonesPaginacion}
    `;
}

function cambiarPaginaCitas(numPag) {
    paginaActualCitas = numPag;
    mostrarCitas();
    const contenidoEl = document.getElementById("contenido");
    if (contenidoEl) contenidoEl.scrollTop = 0;
}

function importarCitasCSV(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(e) {
        const textoCompleto = e.target.result;
        
        // Lector CSV avanzado que ignora comas y saltos de línea internos envueltos en comillas
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
                bufferCelda += "\n"; // Conservar saltos de línea reales dentro de comillas
            } else {
                filaActual.push(bufferCelda.trim());
                if (filaActual.length > 1 || filaActual[0] !== "") {
                    filas.push(filaActual);
                }
                filaActual = [];
                bufferCelda = "";
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
                    anio: Number(c[5]) || 2026,
                    fecha: (c[6] || new Date().toLocaleDateString('es-ES')).replace(/^"|"$/g, "").trim()
                });
                count++;
            }
        }

        guardarEnLocalStorage();
        alert(`¡Se importaron ${count} citas correctamente sin importar comas ni saltos de línea!`);
        paginaActualCitas = 1;
        mostrarCitas();
    };
    lector.readAsText(archivo);
}

function mostrarFormularioCita() {
    const hoy = new Date().toLocaleDateString('es-ES');
    document.getElementById("contenido").innerHTML = `
        <button onclick="mostrarCitas()" class="boton-volver">← Volver</button>
        <h2>💬 Nueva Cita</h2>
        <form id="form-cita" class="formulario-libro">
            <label>Cita / Fragmento</label><textarea id="t-cita" rows="5" required placeholder="Escribe el fragmento aquí..."></textarea>
            <label>Libro</label><input type="text" id="l-cita" required placeholder="Título exacto del libro">
            <label>Autor/a</label><input type="text" id="a-cita">
            <label>Capítulo</label><input type="text" id="c-cita">
            <label>Página</label><input type="text" id="p-cita">
            <label>Año</label><input type="number" id="an-cita" value="2026">
            <label>Fecha de Registro</label><input type="text" id="f-cita" value="${hoy}">
            <button type="submit">Guardar Cita</button>
        </form>
    `;
    document.getElementById("form-cita").addEventListener("submit", (e) => {
        e.preventDefault();
        citas.push({
            id: Date.now(),
            texto: document.getElementById("t-cita").value,
            libro: document.getElementById("l-cita").value,
            autor: document.getElementById("a-cita").value,
            capitulo: document.getElementById("c-cita").value,
            pagina: document.getElementById("p-cita").value,
            anio: Number(document.getElementById("an-cita").value) || 2026,
            fecha: document.getElementById("f-cita").value
        });
        guardarEnLocalStorage();
        mostrarCitas();
    });
}

function editarCita(id) {
    const c = citas.find(item => item.id === id);
    if (!c) return;

    document.getElementById("contenido").innerHTML = `
        <button onclick="mostrarCitas()" class="boton-volver">← Cancelar</button>
        <h2>✏️ Editar Cita</h2>
        <form id="form-edit-cita" class="formulario-libro">
            <label>Cita / Fragmento</label><textarea id="t-cita" rows="5" required>${c.texto || ''}</textarea>
            <label>Libro</label><input type="text" id="l-cita" value="${c.libro || ''}" required>
            <label>Autor/a</label><input type="text" id="a-cita" value="${c.autor || ''}">
            <label>Capítulo</label><input type="text" id="c-cita" value="${c.capitulo || ''}">
            <label>Página</label><input type="text" id="p-cita" value="${c.pagina || ''}">
            <label>Año</label><input type="number" id="an-cita" value="${c.anio || 2026}">
            <label>Fecha de Registro</label><input type="text" id="f-cita" value="${c.fecha || ''}">
            <button type="submit" style="margin-top:10px;">Guardar Cambios</button>
        </form>
    `;

    document.getElementById("form-edit-cita").addEventListener("submit", (e) => {
        e.preventDefault();
        c.texto = document.getElementById("t-cita").value;
        c.libro = document.getElementById("l-cita").value;
        c.autor = document.getElementById("a-cita").value;
        c.capitulo = document.getElementById("c-cita").value;
        c.pagina = document.getElementById("p-cita").value;
        c.anio = Number(document.getElementById("an-cita").value) || 2026;
        c.fecha = document.getElementById("f-cita").value;

        guardarEnLocalStorage();
        alert("¡Cita actualizada correctamente!");
        mostrarCitas();
    });
}

function eliminarCita(id) {
    const c = citas.find(item => item.id === id);
    if (c && confirm(`¿Estás segura de eliminar esta cita de "${c.libro || 'este libro'}"?`)) {
        citas = citas.filter(item => item.id !== id);
        guardarEnLocalStorage();
        mostrarCitas();
    }
}

function vaciarCitas() {
    if (confirm("⚠️ ¿Estás segura de que deseas borrar TODAS las citas registradas?")) {
        citas = [];
        guardarEnLocalStorage();
        mostrarCitas();
    }
}

// --- AUTORES ---
function mostrarAutores() {
    const contenido = document.getElementById("contenido");
    let setA = new Set();
    libros.forEach(l => { if (l.autor && l.autor.trim()) setA.add(l.autor.trim()); });
    let lista = Array.from(setA).sort((a,b) => a.localeCompare(b));
    if (lista.length === 0) {
        contenido.innerHTML = `<div class="autores-index-container"><h2 style="text-align:center; font-size:26px; margin-bottom:5px;">AUTORES</h2><p style="text-align:center; color:#666; margin-top:30px;">Aún no hay autores registrados.</p></div>`;
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
            <div class="contenedor-portada"><span class="badge-numero">${l.numero || i+1}</span><img src="${l.portada}" onerror="this.src='imagenes/libro-default.jpg'"></div>
            <div class="estrellas">${generarEstrellas(l.rating)}</div>
            <div class="linea-subrayado">${l.titulo}</div>
        </div>
    `).join('');
    contenido.innerHTML = `<div><button onclick="mostrarAutores()" class="boton-volver">← Volver</button><h2 style="text-align:center; margin-bottom:20px;">${nombreAutor}</h2><div class="lista-libros">${tarjetas}</div></div>`;
}

// --- REGISTRO DE LECTURAS ---
function mostrarRegistro(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const lAnio = libros.filter(l => (l.anio || 2026) === anioSeleccionado);
    const terminadosList = lAnio.filter(l => l.estado === "Terminado" || l.estado === "Leído");

    let filasTabla = terminadosList.map((l) => {
        const dias = calcularDiasLectura(l.inicio, l.final);
        return `
            <tr>
                <td><span class="badge-estado ${normalizarClase(l.estado)}">${l.estado}</span></td>
                <td style="text-align:left;"><b>${l.titulo}</b></td>
                <td style="text-align:left;">${l.autor}</td>
                <td>${l.inicio || '---'}</td>
                <td>${l.final || '---'}</td>
                <td style="font-weight:bold; color:#319795;">${dias}</td>
                <td>${generarEstrellas(l.rating)}</td>
                <td>
                    <button class="btn-tabla-accion" onclick="editarLibro(${l.id})" title="Editar">✏️</button>
                    <button class="btn-tabla-accion" onclick="eliminarLibro(${l.id})" title="Borrar">🗑️</button>
                </td>
            </tr>
        `;
    }).join('') || `<tr><td colspan="8" style="padding:15px; color:#777;">Sin libros terminados.</td></tr>`;

    contenido.innerHTML = `
        <div class="contenedor-registro-planner">
            <h2 style="text-align:center; margin-bottom:5px;">REGISTRO DE LECTURAS (${anioSeleccionado})</h2>
            ${obtenerSelectorAniosHTML('mostrarRegistro')}

            <div style="overflow-x:auto;">
                <table class="tabla-registro-planner">
                    <thead>
                        <tr>
                            <th>Estado</th><th>Título</th><th>Autor</th><th>Inicio</th><th>Final</th><th>Días</th><th>Puntaje</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${filasTabla}</tbody>
                </table>
            </div>

            <div style="text-align:center; display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:20px;">
                <button onclick="mostrarFormularioNuevoLibro('Terminado')" class="boton-volver" style="background:#5b9bd5; color:white; padding:10px 18px; font-weight:bold; margin:0;">+ Registrar Libro</button>
                <input type="file" id="input-csv-excel" accept=".csv" style="display:none" onchange="importarDesdeCSV(event)">
                <button onclick="document.getElementById('input-csv-excel').click()" class="boton-volver" style="background:#48bb78; color:white; padding:10px 18px; font-weight:bold; margin:0;">📂 Importar desde Excel (CSV)</button>
                <button onclick="vaciarTodosLosDatos()" class="boton-volver" style="background:#f87171; color:white; padding:10px 18px; font-weight:bold; margin:0;">🗑️ Vaciar Todo</button>
            </div>
        </div>
    `;
}

function importarDesdeCSV(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        const contenidoTexto = e.target.result;
        const lineas = contenidoTexto.split("\n");
        let importadosCount = 0;

        for (let i = 1; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            if (!linea) continue;

            const c = linea.split(",").map(val => val.replace(/^"|"$/g, "").trim());
            if (c.length >= 2) {
                const titulo = c[0] || "Sin título";
                const autor = c[1] || "Desconocido";
                const paginas = Number(c[2]) || 0;
                const inicio = c[3] || "";
                const final = c[4] || "";
                const estado = c[5] || "Terminado";
                
                const ratingBruto = c[6] || "5";
                let ratingNum = 5;
                if (!isNaN(ratingBruto)) ratingNum = Number(ratingBruto) || 5;
                else ratingNum = (ratingBruto.match(/★/g) || []).length || 5;

                const personaje1 = c[7] || "";
                const personaje2 = c[8] || "";
                const personajes = [personaje1, personaje2].filter(p => p).join(", ");
                
                const idioma = c[10] || "Español";
                const saga = c[12] || "Autoconclusivo";
                
                const portadaRaw = c[13] || "imagenes/libro-default.jpg";
                const portada = portadaRaw.includes(".") ? portadaRaw : "imagenes/libro-default.jpg";

                const sinopsis = c[14] || "";
                const tropesRaw = c[15] || "";
                const tropes = tropesRaw ? tropesRaw.split(/[-;,]/).map(t => t.trim()).filter(t => t) : [];

                let anioLibro = 2026;
                if (final && final.includes('/')) {
                    const partesFecha = final.split('/');
                    if (partesFecha.length === 3 && partesFecha[2].length === 4) {
                        anioLibro = Number(partesFecha[2]) || 2026;
                    }
                }

                let mesLibro = "enero";
                if (final && final.includes('/')) {
                    const mesNum = Number(final.split('/')[1]);
                    const mesesArr = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
                    if (mesNum >= 1 && mesNum <= 12) mesLibro = mesesArr[mesNum - 1];
                }

                const nuevoLibro = {
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
                    saga: saga,
                    anio: anioLibro,
                    mes: mesLibro,
                    portada: portada,
                    sinopsis: sinopsis,
                    tropes: tropes,
                    esFavoritoMes: false
                };

                libros.push(nuevoLibro);
                importadosCount++;
            }
        }

        guardarEnLocalStorage();
        alert(`¡Se han importado ${importadosCount} libros exitosamente desde tu CSV!`);
        mostrarRegistro(anioSeleccionado);
    };
    lector.readAsText(archivo);
}

// --- ESTADÍSTICAS ---
function mostrarEstadisticas(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const lAnio = libros.filter(l => (l.anio || 2026) === anioSeleccionado);
    const terminadosList = lAnio.filter(l => l.estado === "Terminado" || l.estado === "Leído");
    const proximosList = lAnio.filter(l => l.estado === "Próximo" || l.estado === "Por leer");

    const terminadosCount = terminadosList.length;
    const proximosCount = proximosList.length;

    const mesesConteo = {};
    terminadosList.forEach(l => { const m = (l.mes || "desconocido").toLowerCase(); mesesConteo[m] = (mesesConteo[m] || 0) + 1; });
    let mesMasLector = "---"; let maxMes = 0;
    for (let m in mesesConteo) { if (mesesConteo[m] > maxMes) { maxMes = mesesConteo[m]; mesMasLector = m; } }

    let libroMasLargoObj = terminadosList.reduce((max, l) => (Number(l.paginas) || 0) > (Number(max.paginas) || 0) ? l : max, { paginas: 0 });
    let libroMasLargoTxt = libroMasLargoObj.titulo ? `${libroMasLargoObj.titulo} (${libroMasLargoObj.paginas} págs)` : "---";

    const autoresConteo = {};
    terminadosList.forEach(l => { if (l.autor) { const a = l.autor.trim(); autoresConteo[a] = (autoresConteo[a] || 0) + 1; } });
    let autorMasLeidoTxt = "---"; let maxAutor = 0;
    for (let a in autoresConteo) { if (autoresConteo[a] > maxAutor) { maxAutor = autoresConteo[a]; autorMasLeidoTxt = `${a} (${maxAutor} libros)`; } }

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    terminadosList.forEach(l => { const r = Math.round(l.rating || 0); if (ratingCounts[r] !== undefined) ratingCounts[r]++; });

    let graficaRatingRows = "";
    for (let r = 5; r >= 1; r--) {
        const cant = ratingCounts[r];
        const pct = terminadosCount > 0 ? (cant / terminadosCount) * 100 : 0;
        graficaRatingRows += `<div class="grafica-fila"><div class="grafica-label">${r} ★</div><div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width: ${pct}%; background:#f39c12;"></div></div><div class="grafica-val">${cant}</div></div>`;
    }

    let termEsp = terminadosList.filter(l => (l.idioma || "Español").toLowerCase().includes("espa")).length;
    let termIng = terminadosList.filter(l => (l.idioma || "Español").toLowerCase().includes("ing")).length;
    let proxEsp = proximosList.filter(l => (l.idioma || "Español").toLowerCase().includes("espa")).length;
    let proxIng = proximosList.filter(l => (l.idioma || "Español").toLowerCase().includes("ing")).length;

    const pctTermEsp = terminadosCount > 0 ? (termEsp / terminadosCount) * 100 : 0;
    const pctTermIng = terminadosCount > 0 ? (termIng / terminadosCount) * 100 : 0;
    const pctProxEsp = proximosCount > 0 ? (proxEsp / proximosCount) * 100 : 0;
    const pctProxIng = proximosCount > 0 ? (proxIng / proximosCount) * 100 : 0;

    const mesesLista = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    let filasComparativaMeses = mesesLista.map(m => {
        const c2024 = libros.filter(l => (l.estado === "Terminado" || l.estado === "Leído") && l.anio === 2024 && (l.mes || "").toLowerCase() === m).length;
        const c2025 = libros.filter(l => (l.estado === "Terminado" || l.estado === "Leído") && l.anio === 2025 && (l.mes || "").toLowerCase() === m).length;
        const c2026 = libros.filter(l => (l.estado === "Terminado" || l.estado === "Leído") && l.anio === 2026 && (l.mes || "").toLowerCase() === m).length;
        return `<tr><td style="text-transform:capitalize; font-weight:bold;">${m}</td><td>${c2024}</td><td>${c2025}</td><td>${c2026}</td></tr>`;
    }).join('');

    contenido.innerHTML = `
        <div class="contenedor-registro-planner">
            <h2 style="text-align:center; margin-bottom:5px;">📈 ESTADÍSTICAS Y GRÁFICAS (${anioSeleccionado})</h2>
            ${obtenerSelectorAniosHTML('mostrarEstadisticas')}

            <div class="panel-destacados-grid">
                <div class="card-destacado"><span>Terminados / Próximos</span><strong>${terminadosCount} / ${proximosCount}</strong></div>
                <div class="card-destacado"><span>Mes más Lector</span><strong style="text-transform:capitalize;">${mesMasLector}</strong></div>
                <div class="card-destacado"><span>Autora más Leída</span><strong>${autorMasLeidoTxt}</strong></div>
                <div class="card-destacado"><span>Libro más Largo</span><strong>${libroMasLargoTxt}</strong></div>
            </div>

            <div class="grafica-contenedor">
                <h4>📊 Distribución de Puntuaciones (Libros Terminados)</h4>
                <div class="grafica-barras">${graficaRatingRows}</div>
            </div>

            <div class="grafica-contenedor">
                <h4>🌍 Idioma de Lectura (Español vs Inglés)</h4>
                <div style="font-weight:bold; font-size:12px; margin-bottom:6px;">Libros Terminados (${terminadosCount}):</div>
                <div class="grafica-barras" style="margin-bottom:15px;">
                    <div class="grafica-fila">
                        <div class="grafica-label">Español</div>
                        <div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width: ${pctTermEsp}%; background:#3182ce;"></div></div>
                        <div class="grafica-val">${termEsp}</div>
                    </div>
                    <div class="grafica-fila">
                        <div class="grafica-label">Inglés</div>
                        <div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width: ${pctTermIng}%; background:#805ad5;"></div></div>
                        <div class="grafica-val">${termIng}</div>
                    </div>
                </div>

                <div style="font-weight:bold; font-size:12px; margin-bottom:6px;">Libros Próximos (${proximosCount}):</div>
                <div class="grafica-barras">
                    <div class="grafica-fila">
                        <div class="grafica-label">Español</div>
                        <div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width: ${pctProxEsp}%; background:#3182ce;"></div></div>
                        <div class="grafica-val">${proxEsp}</div>
                    </div>
                    <div class="grafica-fila">
                        <div class="grafica-label">Inglés</div>
                        <div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width: ${pctProxIng}%; background:#805ad5;"></div></div>
                        <div class="grafica-val">${proxIng}</div>
                    </div>
                </div>
            </div>

            <h4 style="text-align:center; margin-bottom:8px; font-size:14px;">📅 Comparativa de Libros Leídos por Mes</h4>
            <div style="overflow-x:auto;">
                <table class="tabla-comparativa-meses">
                    <thead><tr><th>Mes</th><th>2024</th><th>2025</th><th>2026</th></tr></thead>
                    <tbody>${filasComparativaMeses}</tbody>
                </table>
            </div>
        </div>
    `;
}

function editarLibro(id) {
    const l = libros.find(item => item.id === id);
    if (!l || !confirm(`¿Editar "${l.titulo}"?`)) return;

    document.getElementById("contenido").innerHTML = `
        <button onclick="mostrarRegistro(${anioSeleccionado})" class="boton-volver">← Cancelar</button>
        <h2>✏️ Editar Libro</h2>
        <form id="form-edit-completo" class="formulario-libro">
            <label>Título</label><input type="text" id="reg-titulo" value="${l.titulo || ''}" required>
            <label>Autor/a</label><input type="text" id="reg-autor" value="${l.autor || ''}" required>
            <label>Idioma</label>
            <select id="reg-idioma">
                <option value="Español" ${(l.idioma || 'Español') === 'Español' ? 'selected' : ''}>Español 🇪🇸</option>
                <option value="Inglés" ${l.idioma === 'Inglés' ? 'selected' : ''}>Inglés 🇬🇧</option>
            </select>
            <label>Páginas</label><input type="number" id="reg-paginas" value="${l.paginas || ''}">
            <label>Saga</label><input type="text" id="reg-saga" value="${l.saga || ''}">
            <div style="display:flex; gap:10px;"><div style="flex:1;"><label>Inicio</label><input type="text" id="reg-inicio" value="${l.inicio || ''}"></div><div style="flex:1;"><label>Final</label><input type="text" id="reg-final" value="${l.final || ''}"></div></div>
            <div style="display:flex; gap:10px;"><div style="flex:1;"><label>Año</label><input type="number" id="reg-anio" value="${l.anio || 2026}"></div><div style="flex:1;"><label>Mes</label><select id="reg-mes"><option value="enero">Enero</option><option value="febrero">Febrero</option><option value="marzo">Marzo</option><option value="abril">Abril</option><option value="mayo">Mayo</option><option value="junio">Junio</option><option value="julio">Julio</option><option value="agosto">Agosto</option><option value="septiembre">Septiembre</option><option value="octubre">Octubre</option><option value="noviembre">Noviembre</option><option value="diciembre">Diciembre</option></select></div></div>
            <label>Sinopsis</label><textarea id="reg-sinopsis" rows="6">${l.sinopsis || ''}</textarea>
            <label>Estado</label><select id="reg-estado"><option value="Terminado">Terminado</option><option value="Próximo">Próximo</option></select>
            <label>Calificación</label><select id="reg-rating"><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option><option value="2">★★</option><option value="1">★</option></select>
            <label>Portada URL</label><input type="text" id="reg-portada" value="${l.portada || ''}">
            <button type="submit">Guardar Cambios</button>
        </form>
    `;
    document.getElementById("form-edit-completo").addEventListener("submit", (e) => {
        e.preventDefault();
        l.titulo = document.getElementById("reg-titulo").value;
        l.autor = document.getElementById("reg-autor").value;
        l.idioma = document.getElementById("reg-idioma").value;
        l.paginas = Number(document.getElementById("reg-paginas").value) || 0;
        l.saga = document.getElementById("reg-saga").value;
        l.inicio = document.getElementById("reg-inicio").value;
        l.final = document.getElementById("reg-final").value;
        l.sinopsis = document.getElementById("reg-sinopsis").value;
        l.anio = Number(document.getElementById("reg-anio").value);
        l.mes = document.getElementById("reg-mes").value;
        l.estado = document.getElementById("reg-estado").value;
        l.rating = Number(document.getElementById("reg-rating").value);
        l.portada = document.getElementById("reg-portada").value.trim() || "imagenes/libro-default.jpg";
        guardarEnLocalStorage();
        alert("¡Actualizado!");
        mostrarRegistro(l.anio);
    });
}

function eliminarLibro(id) {
    const l = libros.find(item => item.id === id);
    if (l && confirm(`¿Borrar "${l.titulo}"?`)) {
        libros = libros.filter(item => item.id !== id);
        guardarEnLocalStorage();
        mostrarRegistro(anioSeleccionado);
    }
}

function mostrarFormularioNuevoLibro(estadoPredeterminado = "Terminado") {
    document.getElementById("contenido").innerHTML = `
        <button onclick="mostrarRegistro(${anioSeleccionado})" class="boton-volver">← Volver</button>
        <h2>📝 Registrar Libro</h2>
        <form id="form-reg-completo" class="formulario-libro">
            <label>Título</label><input type="text" id="reg-titulo" required>
            <label>Autor/a</label><input type="text" id="reg-autor" required>
            <label>Idioma</label>
            <select id="reg-idioma">
                <option value="Español">Español 🇪🇸</option>
                <option value="Inglés">Inglés 🇬🇧</option>
            </select>
            <label>Páginas</label><input type="number" id="reg-paginas">
            <label>Saga</label><input type="text" id="reg-saga">
            <div style="display:flex; gap:10px;"><div style="flex:1;"><label>Inicio</label><input type="text" id="reg-inicio" placeholder="DD/MM/YYYY"></div><div style="flex:1;"><label>Final</label><input type="text" id="reg-final" placeholder="DD/MM/YYYY"></div></div>
            <div style="display:flex; gap:10px;"><div style="flex:1;"><label>Año</label><input type="number" id="reg-anio" value="2026"></div><div style="flex:1;"><label>Mes</label><select id="reg-mes"><option value="enero">Enero</option><option value="febrero">Febrero</option><option value="marzo">Marzo</option><option value="abril">Abril</option><option value="mayo">Mayo</option><option value="junio">Junio</option><option value="julio">Julio</option><option value="agosto">Agosto</option><option value="septiembre">Septiembre</option><option value="octubre">Octubre</option><option value="noviembre">Noviembre</option><option value="diciembre">Diciembre</option></select></div></div>
            <label>Sinopsis</label><textarea id="reg-sinopsis" rows="6"></textarea>
            <label>Estado</label><select id="reg-estado"><option value="Terminado">Terminado</option><option value="Próximo">Próximo</option></select>
            <label>Calificación</label><select id="reg-rating"><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option><option value="2">★★</option><option value="1">★</option></select>
            <label>Portada URL</label><input type="text" id="reg-portada" placeholder="imagenes/portada.jpg o URL">
            <button type="submit">Guardar Libro</button>
        </form>
    `;
    document.getElementById("form-reg-completo").addEventListener("submit", (e) => {
        e.preventDefault();
        libros.push({
            id: Date.now(), numero: libros.length + 1,
            titulo: document.getElementById("reg-titulo").value,
            autor: document.getElementById("reg-autor").value,
            idioma: document.getElementById("reg-idioma").value,
            paginas: Number(document.getElementById("reg-paginas").value) || 0,
            saga: document.getElementById("reg-saga").value,
            inicio: document.getElementById("reg-inicio").value,
            final: document.getElementById("reg-final").value,
            sinopsis: document.getElementById("reg-sinopsis").value,
            anio: Number(document.getElementById("reg-anio").value),
            mes: document.getElementById("reg-mes").value,
            estado: document.getElementById("reg-estado").value,
            rating: Number(document.getElementById("reg-rating").value),
            portada: document.getElementById("reg-portada").value.trim() || "imagenes/libro-default.jpg",
            tropes: [], esFavoritoMes: false
        });
        guardarEnLocalStorage();
        alert("¡Guardado con éxito!");
        mostrarRegistro(anioSeleccionado);
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
                    <div>
                        <button onclick="mostrarFormularioAdaptacion()" class="boton-volver" style="background:#5b9bd5; color:white; margin:0 5px 0 0;">+ Nueva</button>
                        <input type="file" id="input-csv-adapt" accept=".csv" style="display:none" onchange="importarAdaptacionesCSV(event)">
                        <button onclick="document.getElementById('input-csv-adapt').click()" class="boton-volver" style="background:#48bb78; color:white; margin:0 5px 0 0;">📂 CSV</button>
                        <button onclick="vaciarAdaptaciones()" class="boton-volver" style="background:#f87171; color:white; margin:0;">🗑️ Vaciar</button>
                    </div>
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
                <div>
                    <button onclick="mostrarFormularioAdaptacion()" class="boton-volver" style="background:#5b9bd5; color:white; margin:0 5px 0 0;">+ Nueva</button>
                    <input type="file" id="input-csv-adapt" accept=".csv" style="display:none" onchange="importarAdaptacionesCSV(event)">
                    <button onclick="document.getElementById('input-csv-adapt').click()" class="boton-volver" style="background:#48bb78; color:white; margin:0 5px 0 0;">📂 CSV</button>
                    <button onclick="vaciarAdaptaciones()" class="boton-volver" style="background:#f87171; color:white; margin:0;">🗑️ Vaciar</button>
                </div>
            </div>
            <div style="width:120px; height:2px; background:#4a77d4; margin:0 auto 20px auto;"></div>
            <div class="autores-grid-3cols">${botonesHTML}</div>
        </div>
    `;
}

function verDetalleAdaptacion(id) {
    const indexAd = adaptaciones.findIndex(item => item.id === id);
    if (indexAd === -1) return;
    const ad = adaptaciones[indexAd];
    const numAdaptacion = indexAd + 1;

    const libInactivo = !ad.ratingLibro || Number(ad.ratingLibro) === 0;
    const pelInactivo = !ad.ratingPelicula || Number(ad.ratingPelicula) === 0;

    const estrellasLibroHtml = generarEstrellasGrandes(libInactivo ? 0 : ad.ratingLibro, libInactivo);
    const estrellasPeliHtml = generarEstrellasGrandes(pelInactivo ? 0 : ad.ratingPelicula, pelInactivo);
    const numLibreria = obtenerNumeroLibroEnLibreria(ad.nombreLibro || ad.titulo);

    document.getElementById("contenido").innerHTML = `
        <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <button onclick="mostrarAdaptaciones()" class="boton-volver">← Volver</button>
                <div>
                    <button onclick="editarAdaptacion(${ad.id})" class="boton-volver" style="background:#fef08a; margin-right:6px;">✏️ Editar</button>
                    <button onclick="eliminarAdaptacion(${ad.id})" class="boton-volver" style="background:#f87171; color:white;">🗑️ Borrar</button>
                </div>
            </div>
            <div class="adaptacion-card-detalle">
                <h2 style="text-align:center; margin-bottom:20px;">${ad.titulo}</h2>
                <div class="adaptacion-grid-comparativa">
                    
                    <div class="adaptacion-columna-media">
                        <div style="position:relative;">
                            <span class="badge-numero">${numAdaptacion}</span>
                            <img src="${ad.posterPelicula || 'imagenes/libro-default.jpg'}" class="adaptacion-poster" onerror="this.src='imagenes/libro-default.jpg'">
                        </div>
                        <div style="margin-top:6px;">${estrellasPeliHtml}</div>
                        <div class="adaptacion-info-detalles">
                            <div class="adaptacion-info-fila">PELÍCULA / SERIE: <span>${ad.nombrePelicula || ad.titulo}</span></div>
                            <div class="adaptacion-info-fila">AÑO: <span>${ad.anioPelicula || '---'}</span></div>
                            <div class="adaptacion-info-fila">PLATAFORMA: <span>${ad.plataforma || '---'}</span></div>
                        </div>
                    </div>

                    <div class="adaptacion-divisor-vertical"></div>

                    <div class="adaptacion-columna-media">
                        <div style="position:relative;">
                            <span class="badge-numero">${numLibreria}</span>
                            <img src="${ad.portadaLibro || 'imagenes/libro-default.jpg'}" class="adaptacion-poster" onerror="this.src='imagenes/libro-default.jpg'">
                        </div>
                        <div style="margin-top:6px;">${estrellasLibroHtml}</div>
                        <div class="adaptacion-info-detalles">
                            <div class="adaptacion-info-fila">LIBRO: <span>${ad.nombreLibro || ad.titulo}</span></div>
                            <div class="adaptacion-info-fila">AUTOR/A: <span>${ad.autor || '---'}</span></div>
                            <div class="adaptacion-info-fila">AÑO: <span>${ad.anioLibro || '---'}</span></div>
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
            <label>Título de la Obra General</label><input type="text" id="ad-titulo" required>
            <label>--- DATOS DE LA PELÍCULA / SERIE ---</label>
            <label>Nombre de la Película / Serie</label><input type="text" id="ad-nombp">
            <label>Año Película</label><input type="number" id="ad-anip">
            <label>Plataforma</label><input type="text" id="ad-plat">
            <label>Puntuación Película (0 o vacío si no se vio)</label><input type="number" id="ad-ratp" min="0" max="5" placeholder="Ej. 5">
            <label>URL o Ruta Póster Película</label><input type="text" id="ad-postp" placeholder="imagenes/peli.jpg">

            <label style="margin-top:10px;">--- DATOS DEL LIBRO ---</label>
            <label>Nombre del Libro (para vinculación con librería)</label><input type="text" id="ad-nombl">
            <label>Autor/a</label><input type="text" id="ad-autor">
            <label>Año Libro</label><input type="number" id="ad-anil">
            <label>Puntuación Libro (0 o vacío si no se leyó)</label><input type="number" id="ad-ratl" min="0" max="5" placeholder="Ej. 4">
            <label>URL o Ruta Portada Libro</label><input type="text" id="ad-portl" placeholder="imagenes/libro.jpg">

            <button type="submit" style="margin-top:15px;">Guardar Adaptación</button>
        </form>
    `;
    document.getElementById("form-adapt").addEventListener("submit", (e) => {
        e.preventDefault();
        adaptaciones.push({
            id: Date.now(),
            titulo: document.getElementById("ad-titulo").value,
            nombrePelicula: document.getElementById("ad-nombp").value,
            anioPelicula: Number(document.getElementById("ad-anip").value) || "",
            plataforma: document.getElementById("ad-plat").value,
            ratingPelicula: Number(document.getElementById("ad-ratp").value) || 0,
            posterPelicula: document.getElementById("ad-postp").value.trim() || "imagenes/libro-default.jpg",
            nombreLibro: document.getElementById("ad-nombl").value,
            autor: document.getElementById("ad-autor").value,
            anioLibro: Number(document.getElementById("ad-anil").value) || "",
            ratingLibro: Number(document.getElementById("ad-ratl").value) || 0,
            portadaLibro: document.getElementById("ad-portl").value.trim() || "imagenes/libro-default.jpg"
        });
        guardarEnLocalStorage();
        alert("¡Adaptación guardada!");
        mostrarAdaptaciones();
    });
}

function editarAdaptacion(id) {
    const ad = adaptaciones.find(item => item.id === id);
    if (!ad) return;
    document.getElementById("contenido").innerHTML = `
        <button onclick="verDetalleAdaptacion(${ad.id})" class="boton-volver">← Cancelar</button>
        <h2>✏️ Editar Adaptación</h2>
        <form id="form-edit-adapt" class="formulario-libro">
            <label>Título Obra</label><input type="text" id="ad-titulo" value="${ad.titulo || ''}" required>
            <label>Nombre Película</label><input type="text" id="ad-nombp" value="${ad.nombrePelicula || ''}">
            <label>Año Película</label><input type="number" id="ad-anip" value="${ad.anioPelicula || ''}">
            <label>Plataforma</label><input type="text" id="ad-plat" value="${ad.plataforma || ''}">
            <label>Puntuación Película (0 si no se vio)</label><input type="number" id="ad-ratp" min="0" max="5" value="${ad.ratingPelicula || 0}">
            <label>Póster Película URL</label><input type="text" id="ad-postp" value="${ad.posterPelicula || ''}">
            
            <label>Nombre Libro</label><input type="text" id="ad-nombl" value="${ad.nombreLibro || ''}">
            <label>Autor/a Libro</label><input type="text" id="ad-autor" value="${ad.autor || ''}">
            <label>Año Libro</label><input type="number" id="ad-anil" value="${ad.anioLibro || ''}">
            <label>Puntuación Libro (0 si no se leyó)</label><input type="number" id="ad-ratl" min="0" max="5" value="${ad.ratingLibro || 0}">
            <label>Portada Libro URL</label><input type="text" id="ad-portl" value="${ad.portadaLibro || ''}">

            <button type="submit" style="margin-top:15px;">Guardar Cambios</button>
        </form>
    `;
    document.getElementById("form-edit-adapt").addEventListener("submit", (e) => {
        e.preventDefault();
        ad.titulo = document.getElementById("ad-titulo").value;
        ad.nombrePelicula = document.getElementById("ad-nombp").value;
        ad.anioPelicula = Number(document.getElementById("ad-anip").value) || "";
        ad.plataforma = document.getElementById("ad-plat").value;
        ad.ratingPelicula = Number(document.getElementById("ad-ratp").value) || 0;
        ad.posterPelicula = document.getElementById("ad-postp").value.trim() || "imagenes/libro-default.jpg";
        ad.nombreLibro = document.getElementById("ad-nombl").value;
        ad.autor = document.getElementById("ad-autor").value;
        ad.anioLibro = Number(document.getElementById("ad-anil").value) || "";
        ad.ratingLibro = Number(document.getElementById("ad-ratl").value) || 0;
        ad.portadaLibro = document.getElementById("ad-portl").value.trim() || "imagenes/libro-default.jpg";

        guardarEnLocalStorage();
        alert("¡Adaptación actualizada!");
        verDetalleAdaptacion(ad.id);
    });
}

function eliminarAdaptacion(id) {
    if (confirm("¿Estás segura de eliminar esta adaptación?")) {
        adaptaciones = adaptaciones.filter(item => item.id !== id);
        guardarEnLocalStorage();
        mostrarAdaptaciones();
    }
}

function importarAdaptacionesCSV(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(e) {
        const lineas = e.target.result.split("\n");
        let count = 0;
        for (let i = 1; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            if (!linea) continue;
            const c = linea.split(",").map(val => val.replace(/^"|"$/g, "").trim());
            if (c.length >= 2) {
                const posterPeli = c[5] ? c[5] : "imagenes/libro-default.jpg";
                const portadaLib = c[9] ? c[9] : "imagenes/libro-default.jpg";

                adaptaciones.push({
                    id: Date.now() + i,
                    titulo: c[0] || "Obra",
                    nombrePelicula: c[1] || "",
                    anioPelicula: Number(c[2]) || "",
                    plataforma: c[3] || "",
                    ratingPelicula: Number(c[4]) || 0,
                    posterPelicula: posterPeli.includes(".") ? posterPeli : "imagenes/libro-default.jpg",
                    autor: c[6] || "",
                    anioLibro: Number(c[7]) || "",
                    ratingLibro: Number(c[8]) || 0,
                    portadaLibro: portadaLib.includes(".") ? portadaLib : "imagenes/libro-default.jpg"
                });
                count++;
            }
        }
        guardarEnLocalStorage();
        alert(`¡Se importaron ${count} adaptaciones!`);
        mostrarAdaptaciones();
    };
    lector.readAsText(archivo);
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

// Carga inicial
window.onload = () => { mostrarPagina('inicio'); };
// --- BASE DE DATOS LOCAL ---
let libros = JSON.parse(localStorage.getItem("libros")) || [
    {
        id: 1,
        numero: 1,
        titulo: "Un día de Diciembre",
        autor: "Josie Silver",
        paginas: 302,
        saga: "Autoconclusivo",
        publicacion: "10/10/2019",
        inicio: "26/07/2021",
        final: "16/08/2021",
        personajes: "Laurie y Jack",
        estado: "Leído",
        rating: 4,
        genero: "Romance",
        anio: 2026,
        mes: "agosto",
        esFavoritoMes: true,
        sinopsis: "Laurie no cree en el amor a primera vista. Piensa que una cosa son las películas y otra, la vida real. Sin embargo, un día de diciembre, su mirada se cruza con la de un desconocido a través de la ventanilla empañada del autobús...",
        tropes: ["Boyfriend best friend", "Relación falsa", "Second chance", "Slow burn"],
        portada: "images/libro-default.jpg"
    }
];

let citas = JSON.parse(localStorage.getItem("citas")) || [
    {
        id: 1,
        numero: 1,
        texto: "—No me esperes, Ginger. Cuatro palabras. Cuatro palabras que se me clavaron, que dolieron...",
        libro: "Nosotros en la Luna",
        autor: "Alice Kellen",
        capitulo: "33 GINGER",
        pagina: "154 (36%)",
        fecha: "30 de mayo de 2022"
    }
];

let adaptaciones = JSON.parse(localStorage.getItem("adaptaciones")) || [
    {
        id: 1,
        titulo: "A dos metros de ti",
        autor: "Rachael Lippincott",
        anioLibro: 2014,
        ratingLibro: 4,
        anioPelicula: 2019,
        plataforma: "CBS / Netflix",
        ratingPelicula: 5,
        portadaLibro: "images/libro-default.jpg",
        posterPelicula: "images/libro-default.jpg"
    }
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
    let estrellas = "";
    for (let i = 1; i <= 5; i++) {
        estrellas += i <= rating ? "★" : "☆";
    }
    return estrellas;
}

function normalizarClase(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
}

// --- NAVEGACIÓN Y PESTAÑAS ---
function mostrarPagina(pagina) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if(btn.getAttribute('data-tab') === pagina) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const contenido = document.getElementById("contenido");

    if (pagina === "inicio") {
        contenido.innerHTML = `
            <div class="portada-inicio">
                <h1>BOOK<br>JOURNAL</h1>
            </div>
        `;
    } else if (pagina === "libreria") {
        mostrarLibreria();
    } else if (pagina === "estanterias") {
        mostrarEstanterias();
    } else if (pagina === "favorito") {
        mostrarFavoritosPorAnio();
    } else if (pagina === "tracker") {
        mostrarTracker();
    } else if (pagina === "citas") {
        mostrarCitas();
    } else if (pagina === "autores") {
        mostrarAutores();
    } else if (pagina === "registro") {
        mostrarRegistro();
    } else if (pagina === "adaptaciones") {
        mostrarAdaptaciones();
    } else if (pagina === "recap") {
        mostrarRecapPorAnio();
    }
}

// --- VISTA LIBRERÍA (CON NÚMEROS DE ORDEN) ---
function mostrarLibreria() {
    const contenido = document.getElementById("contenido");
    let tarjetas = "";

    libros.forEach((libro, index) => {
        const numOrd = libro.numero || (index + 1);
        tarjetas += `
            <div class="tarjeta-libro" onclick="verResenaLibro(${libro.id})">
                <div class="contenedor-portada">
                    <span class="badge-numero">${numOrd}</span>
                    <img src="${libro.portada}" alt="${libro.titulo}" onerror="this.src='images/libro-default.jpg'">
                </div>
                <div class="estrellas">${generarEstrellas(libro.rating)}</div>
                <div class="linea-subrayado">${libro.titulo}</div>
                <div style="font-size:13px; color:#555;">${libro.autor}</div>
            </div>
        `;
    });

    contenido.innerHTML = `
        <h2 style="text-align:left; font-size:24px; font-weight:bold; margin-bottom:15px;">LIBRERÍA</h2>
        <div class="lista-libros">
            ${tarjetas}
        </div>
    `;
}

// --- FICHA RESEÑA DETALLADA ---
function verResenaLibro(id) {
    const libro = libros.find(l => l.id === id);
    if (!libro) return;

    const contenido = document.getElementById("contenido");
    const numOrd = libro.numero || 1;

    let listaTropes = "";
    if (libro.tropes && libro.tropes.length > 0) {
        libro.tropes.forEach(t => { listaTropes += `<li>${t}</li>`; });
    } else {
        listaTropes = "<li>Puntos clave de la lectura</li>";
    }

    contenido.innerHTML = `
        <div class="vista-resena">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <button onclick="mostrarLibreria()" class="boton-volver">← Volver a librería</button>
                <div class="resena-titulo-head">RESEÑA ${numOrd}</div>
            </div>

            <div class="resena-contenido">
                <div class="columna-izquierda-resena">
                    <div class="contenedor-portada" style="width:160px; height:230px;">
                        <img src="${libro.portada}" alt="${libro.titulo}" onerror="this.src='images/libro-default.jpg'">
                    </div>
                    <div class="estrellas" style="font-size:22px; margin-top:8px;">${generarEstrellas(libro.rating)}</div>
                    <div class="linea-subrayado" style="text-align:center;">${libro.titulo}</div>
                    <div style="font-size:13px; text-align:center; margin-bottom:10px;">${libro.autor}</div>

                    <div class="caja-notas">
                        <h4>NOTAS:</h4>
                        <ul>${listaTropes}</ul>
                    </div>
                </div>

                <div class="columna-derecha-resena">
                    <div class="texto-sinopsis">
                        ${libro.sinopsis || "Aquí va la opinión o sinopsis general sobre esta lectura..."}
                    </div>

                    <div class="metadatos-inferior">
                        <div class="metadatos-row">
                            <span>PÁGINAS: ${libro.paginas || '---'}</span>
                            <span>SAGA: ${libro.saga || 'Autoconclusivo'}</span>
                            <span>PUBLICACIÓN: ${libro.publicacion || '---'}</span>
                        </div>
                        <div class="metadatos-row">
                            <span>INICIO: ${libro.inicio || '---'}</span>
                            <span>FINAL: ${libro.final || '---'}</span>
                        </div>
                        <div class="metadatos-row">
                            <span>PERSONAJES: ${libro.personajes || '---'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- ESTANTERÍA VIRTUAL ILUSTRADA ---
const paletaColoresPastel = ["#4fa8eb", "#7ed321", "#bd10e0", "#f5a623", "#50e3c2", "#e91e63", "#f8e71c", "#9013fe", "#4a90e2", "#b8e986", "#ff7675", "#fd79a8"];

function mostrarEstanterias() {
    const contenido = document.getElementById("contenido");
    const librosTerminados = libros.filter(l => l.estado === "Leído" || l.estado === "Terminado");

    if (librosTerminados.length === 0) {
        contenido.innerHTML = `
            <h2>📖 Estantería Virtual</h2>
            <p style="text-align:center; color:#666; margin-top:20px;">Aún no tienes libros terminados registrados.</p>
        `;
        return;
    }

    const repisas = [[], [], [], []];
    librosTerminados.forEach((libro, index) => {
        repisas[index % 4].push({ ...libro, indexGlobal: index });
    });

    const decoracionesSVG = [
        `<div class="decoracion-estante"><svg class="decoracion-svg" viewBox="0 0 64 64" fill="none" stroke="#2c3e50" stroke-width="2.5"><rect x="20" y="18" width="24" height="32" rx="4" fill="#fffdf0"/></svg></div>`,
        `<div class="decoracion-estante"><svg class="decoracion-svg" viewBox="0 0 64 64" fill="none" stroke="#2c3e50" stroke-width="2.5"><path d="M18 20 h28 l2 34 a4 4 0 0 1 -4 4 h-24 a4 4 0 0 1 -4 -4 z" fill="#f8fafc"/></svg></div>`,
        ``,
        `<div class="decoracion-estante"><svg class="decoracion-svg" viewBox="0 0 64 64" fill="none" stroke="#2c3e50" stroke-width="2.5"><rect x="12" y="22" width="40" height="28" rx="5" fill="#f8fafc"/><circle cx="32" cy="36" r="8" fill="#e2e8f0"/></svg></div>`
    ];

    let htmlRepisas = "";
    repisas.forEach((librosRepisa, idxRepisa) => {
        let contenidoRepisa = "";
        librosRepisa.forEach((libro, idxInside) => {
            const colorFondo = paletaColoresPastel[libro.indexGlobal % paletaColoresPastel.length];
            const altoTomo = [150, 165, 140, 155][libro.indexGlobal % 4];
            const anchoTomo = [34, 38, 30, 42][libro.indexGlobal % 4];

            const claseInclinado = (idxInside === 2 && librosRepisa.length > 4) ? "inclinado" : "";
            contenidoRepisa += `
                <div class="libro-tomo ${claseInclinado}" onclick="verResenaLibro(${libro.id})" style="background-color: ${colorFondo}; height: ${altoTomo}px; width: ${anchoTomo}px;" title="${libro.titulo}">
                    <span>${libro.titulo}</span>
                </div>
            `;
        });

        htmlRepisas += `<div class="repisa-madera">${contenidoRepisa}${decoracionesSVG[idxRepisa]}</div>`;
    });

    contenido.innerHTML = `
        <h2 style="text-align:center; margin-bottom:15px;">ESTANTERÍA VIRTUAL</h2>
        <div class="estanteria-contenedor">${htmlRepisas}</div>
    `;
}

// --- FAVORITO DEL MES (2 SLOTS POR MES) ---
function mostrarFavoritosPorAnio(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    let htmlMeses = "";
    meses.forEach(mes => {
        const favoritosMes = libros.filter(l => (l.anio || 2026) === anioSeleccionado && (l.mes || "").toLowerCase() === mes && l.esFavoritoMes === true);

        let slot1Html = favoritosMes.length > 0 ? `<div class="portada-slot"><img src="${favoritosMes[0].portada}" onerror="this.parentElement.innerHTML='<span>${favoritosMes[0].titulo}</span>'"></div>` : `<div class="portada-slot"><span>+ Favorito 1</span></div>`;
        let slot2Html = favoritosMes.length > 1 ? `<div class="portada-slot"><img src="${favoritosMes[1].portada}" onerror="this.parentElement.innerHTML='<span>${favoritosMes[1].titulo}</span>'"></div>` : `<div class="portada-slot"><span>+ Favorito 2</span></div>`;

        htmlMeses += `
            <div class="tarjeta-mes-fav">
                <div class="nombre-mes-cursiva">${mes}</div>
                <div class="slot-portadas">${slot1Html}${slot2Html}</div>
            </div>
        `;
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

// --- RECAP MENSUAL Y DETALLE POR MES ---
function mostrarRecapPorAnio(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    let htmlMeses = "";
    meses.forEach(mes => {
        const librosMes = libros.filter(l => l.estado === "Leído" && (l.anio || 2026) === anioSeleccionado && (l.mes || "").toLowerCase() === mes);
        const cant = librosMes.length;
        const pags = librosMes.reduce((t, l) => t + (Number(l.paginas) || 0), 0);

        htmlMeses += `
            <div class="tarjeta-mes" onclick="mostrarDetalleRecapMes('${mes}', ${anioSeleccionado})">
                <h4 style="text-transform:capitalize; font-family:'Caveat',cursive; font-size:22px;">${mes}</h4>
                <p>📚 Leídos: <strong>${cant}</strong></p>
                <p>📖 Páginas: <strong>${pags}</strong></p>
            </div>
        `;
    });

    contenido.innerHTML = `
        <h2>📊 Recap Mensual y Anual</h2>
        <div class="selector-anio">
            <button class="btn-anio ${anioSeleccionado === 2026 ? 'activo' : ''}" onclick="mostrarRecapPorAnio(2026)">2026</button>
            <button class="btn-anio ${anioSeleccionado === 2025 ? 'activo' : ''}" onclick="mostrarRecapPorAnio(2025)">2025</button>
        </div>
        <div class="grilla-meses">${htmlMeses}</div>
    `;
}

function mostrarDetalleRecapMes(mes, anio) {
    const contenido = document.getElementById("contenido");
    const librosMes = libros.filter(l => (l.anio || 2026) === anio && (l.mes || "").toLowerCase() === mes);
    const totalLeidosMes = librosMes.length;
    const totalPaginasMes = librosMes.reduce((t, l) => t + (Number(l.paginas) || 0), 0);

    const librosOrdenados = [...librosMes].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const libroMasGustado = librosOrdenados[0];
    const libroMenosGustado = librosOrdenados[librosOrdenados.length - 1];
    const top3Lecturas = librosOrdenados.slice(0, 3);

    contenido.innerHTML = `
        <div class="recap-detalle-container">
            <button onclick="mostrarRecapPorAnio(${anio})" class="boton-volver">← Volver</button>
            <h2 style="font-family:'Caveat',cursive; font-size:36px; text-transform:capitalize; text-align:center; margin-bottom:15px;">${mes} ${anio}</h2>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                <div class="formulario-libro"><h4>Más gustado</h4>${libroMasGustado ? `<strong>${libroMasGustado.titulo}</strong><div>${generarEstrellas(libroMasGustado.rating)}</div>` : 'Sin registros'}</div>
                <div class="formulario-libro"><h4>Menos gustado</h4>${libroMenosGustado ? `<strong>${libroMenosGustado.titulo}</strong><div>${generarEstrellas(libroMenosGustado.rating)}</div>` : 'Sin registros'}</div>
            </div>

            <div style="background:#f0f7fa; padding:15px; border-radius:10px; text-align:center; margin-bottom:20px;">
                <h4>Top 3 mejores lecturas</h4>
                <div style="display:flex; justify-content:center; gap:15px; margin-top:10px;">
                    ${top3Lecturas.map(l => `<span style="font-weight:bold; font-size:13px;">${l.titulo}</span>`).join('') || 'Sin suficientes libros'}
                </div>
            </div>

            <div class="estadisticas-anio-caja">
                <div class="stat-item"><span>Libros leídos</span><strong>${totalLeidosMes}</strong></div>
                <div class="stat-item"><span>Páginas leídas</span><strong>${totalPaginasMes}</strong></div>
            </div>
        </div>
    `;
}

// --- READING TRACKER ANUAL ---
function obtenerClaseRangoPaginas(paginas) {
    if (paginas === undefined || paginas === null || paginas === "") return "rango-vacio";
    const p = Number(paginas);
    if (p <= 10) return "rango-0-10";
    if (p <= 20) return "rango-11-20";
    if (p <= 30) return "rango-21-30";
    if (p <= 40) return "rango-31-40";
    if (p <= 50) return "rango-41-50";
    if (p <= 80) return "rango-51-80";
    if (p <= 100) return "rango-81-100";
    return "rango-100-plus";
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
        let celdasMeses = "";
        mesesArray.forEach(mes => {
            if (dia > mes.dias) {
                celdasMeses += `<td class="rango-invalido"></td>`;
            } else {
                const fechaKey = `${anioSeleccionado}-${String(mes.index + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const pags = habitTrackerData[fechaKey] !== undefined ? habitTrackerData[fechaKey] : "";
                celdasMeses += `<td class="celda-tracker ${obtenerClaseRangoPaginas(pags)}" onclick="registrarPaginasDia('${fechaKey}', ${dia}, '${mes.nombre}')"></td>`;
            }
        });
        filasTabla += `<tr><th style="font-size:10px;">${dia}</th>${celdasMeses}</tr>`;
    }

    contenido.innerHTML = `
        <h2 style="text-align:center; margin-bottom:10px;">READING TRACKER (${anioSeleccionado})</h2>
        <div class="selector-anio">
            <button class="btn-anio ${anioSeleccionado === 2026 ? 'activo' : ''}" onclick="mostrarTracker(2026)">2026</button>
            <button class="btn-anio ${anioSeleccionado === 2025 ? 'activo' : ''}" onclick="mostrarTracker(2025)">2025</button>
        </div>
        <div class="tracker-anual-container">
            <div class="tracker-tabla-wrapper">
                <table class="tabla-tracker-anual">
                    <thead><tr><th></th>${mesesArray.map(m => `<th>${m.nombre}</th>`).join('')}</tr></thead>
                    <tbody>${filasTabla}</tbody>
                </table>
            </div>
            <div class="tracker-leyenda-panel">
                <h4>PÁGINAS</h4>
                <div class="leyenda-item"><div class="leyenda-color-box rango-0-10"></div> <span>0 - 10</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-11-20"></div> <span>11 - 20</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-21-30"></div> <span>21 - 30</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-31-40"></div> <span>31 - 40</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-41-50"></div> <span>41 - 50</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-51-80"></div> <span>51 - 80</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-81-100"></div> <span>81 - 100</span></div>
                <div class="leyenda-item"><div class="leyenda-color-box rango-100-plus"></div> <span>100+</span></div>
            </div>
        </div>
    `;
}

function registrarPaginasDia(fechaKey, dia, mesNombre) {
    const ingreso = prompt(`¿Cuántas páginas leíste el día ${dia} (${mesNombre})?`, habitTrackerData[fechaKey] || "");
    if (ingreso === null) return;
    if (ingreso.trim() === "") delete habitTrackerData[fechaKey];
    else habitTrackerData[fechaKey] = Number(ingreso);
    guardarEnLocalStorage();
    mostrarTracker(anioSeleccionado);
}

// --- CITAS ---
function mostrarCitas() {
    const contenido = document.getElementById("contenido");
    let htmlCitas = citas.map(c => `
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

    contenido.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2 style="font-size:24px; font-weight:bold;">CITAS</h2>
            <button onclick="mostrarFormularioCita()" class="boton-volver" style="margin:0;">+ Nueva cita</button>
        </div>
        <div class="contenedor-citas-planner">${htmlCitas || '<p style="text-align:center;">No hay citas.</p>'}</div>
    `;
}

function mostrarFormularioCita() {
    const contenido = document.getElementById("contenido");
    contenido.innerHTML = `
        <h2>💬 Nueva cita</h2>
        <form id="form-cita" class="formulario-libro">
            <label>Cita</label><textarea id="texto-cita" rows="4" required></textarea>
            <label>Libro</label><input type="text" id="libro-cita" required>
            <label>Autor</label><input type="text" id="autor-cita">
            <label>Capítulo</label><input type="text" id="capitulo-cita">
            <label>Página</label><input type="text" id="pagina-cita">
            <label>Fecha</label><input type="text" id="fecha-cita" value="10 de octubre de 2026">
            <button type="submit">Guardar cita</button>
        </form>
    `;
    document.getElementById("form-cita").addEventListener("submit", (e) => {
        e.preventDefault();
        citas.push({
            id: Date.now(),
            numero: citas.length + 1,
            texto: document.getElementById("texto-cita").value,
            libro: document.getElementById("libro-cita").value,
            autor: document.getElementById("autor-cita").value,
            capitulo: document.getElementById("capitulo-cita").value,
            pagina: document.getElementById("pagina-cita").value,
            fecha: document.getElementById("fecha-cita").value
        });
        guardarEnLocalStorage();
        mostrarCitas();
    });
}

// --- AUTORES ---
function mostrarAutores() {
    const contenido = document.getElementById("contenido");
    let autoresSet = new Set();
    libros.forEach(l => { if (l.autor) autoresSet.add(l.autor.trim()); });
    if (autoresSet.size === 0) autoresSet.add("Alice Kellen").add("Julia Quinn").add("Colleen Hoover");

    let listaAutores = Array.from(autoresSet).sort((a, b) => a.localeCompare(b));
    let botonesHTML = listaAutores.map(a => `<button class="autor-btn-item" onclick="mostrarLibrosDeAutor('${a.replace(/'/g, "\\'")}')">${a}</button>`).join('');

    contenido.innerHTML = `
        <div class="autores-index-container">
            <h2 style="text-align:center; font-size:26px; margin-bottom:5px;">AUTORES</h2>
            <div style="width:120px; height:2px; background:#4a77d4; margin:0 auto 20px auto;"></div>
            <div class="autores-grid-3cols">${botonesHTML}</div>
        </div>
    `;
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
            <div class="lista-libros">${tarjetas || '<p>Sin libros.</p>'}</div>
        </div>
    `;
}

// --- REGISTRO Y TABLA ---
function mostrarRegistro(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const librosAnio = libros.filter(l => (l.anio || 2026) === anioSeleccionado);
    const totalLeidos = librosAnio.filter(l => l.estado === "Leído" || l.estado === "Terminado").length;
    const totalPaginas = librosAnio.reduce((acc, l) => acc + (Number(l.paginas) || 0), 0);

    let filas = librosAnio.map((l, i) => `
        <tr>
            <td style="font-weight:bold; background:#f0f4f8;">${l.numero || i+1}</td>
            <td><span class="badge-estado ${normalizarClase(l.estado)}">${l.estado}</span></td>
            <td style="text-align:left; font-weight:bold;">${l.titulo}</td>
            <td style="text-align:left; color:#555;">${l.autor}</td>
            <td>${l.inicio || '---'}</td>
            <td>${l.final || '---'}</td>
            <td style="color:#fbc02d;">${generarEstrellas(l.rating)}</td>
        </tr>
    `).join('') || `<tr><td colspan="7" style="padding:15px;">No hay registros este año.</td></tr>`;

    contenido.innerHTML = `
        <div class="contenedor-registro-planner">
            <h2 style="text-align:center; margin-bottom:5px;">REGISTRO DE LIBROS (${anioSeleccionado})</h2>
            <div class="selector-anio">
                <button class="btn-anio ${anioSeleccionado === 2026 ? 'activo' : ''}" onclick="mostrarRegistro(2026)">2026</button>
                <button class="btn-anio ${anioSeleccionado === 2025 ? 'activo' : ''}" onclick="mostrarRegistro(2025)">2025</button>
            </div>
            <div class="estadisticas-anio-caja">
                <div class="stat-item"><span>Terminados</span><strong>${totalLeidos}</strong></div>
                <div class="stat-item"><span>Páginas</span><strong>${totalPaginas}</strong></div>
            </div>
            <div style="overflow-x:auto;">
                <table class="tabla-registro-planner">
                    <thead><tr><th>#</th><th>ESTADO</th><th>TÍTULO</th><th>AUTOR</th><th>INICIO</th><th>FINAL</th><th>PUNTAJE</th></tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
            <div style="text-align:center;"><button onclick="mostrarFormularioNuevoLibro()" class="boton-volver" style="background:#a2d2d6; padding:10px 15px;">+ Registrar libro</button></div>
        </div>
    `;
}

function mostrarFormularioNuevoLibro() {
    document.getElementById("contenido").innerHTML = `
        <button onclick="mostrarRegistro(${anioSeleccionado})" class="boton-volver">← Volver</button>
        <h2>📝 Registrar libro</h2>
        <form id="form- reg" class="formulario-libro">
            <label>Título</label><input type="text" id="reg-titulo" required>
            <label>Autor</label><input type="text" id="reg-autor" required>
            <label>Páginas</label><input type="number" id="reg-paginas">
            <label>Inicio</label><input type="text" id="reg-inicio" placeholder="DD/MM/YYYY">
            <label>Final</label><input type="text" id="reg-final" placeholder="DD/MM/YYYY">
            <label>Año</label><input type="number" id="reg-anio" value="2026">
            <label>Mes</label>
            <select id="reg-mes"><option value="enero">Enero</option><option value="febrero">Febrero</option><option value="marzo">Marzo</option><option value="abril">Abril</option><option value="mayo">Mayo</option><option value="junio">Junio</option><option value="julio">Julio</option><option value="agosto">Agosto</option><option value="septiembre">Septiembre</option><option value="octubre">Octubre</option><option value="noviembre">Noviembre</option><option value="diciembre">Diciembre</option></select>
            <label>Estado</label><select id="reg-estado"><option value="Terminado">Terminado</option><option value="Leyendo">Leyendo</option><option value="Por leer">Por leer</option></select>
            <label>Calificación</label><select id="reg-rating"><option value="5">★★★★★</option><option value="4">★★★★</option><option value="3">★★★</option></select>
            <button type="submit">Guardar</button>
        </form>
    `;
    document.getElementById("form- reg").addEventListener("submit", (e) => {
        e.preventDefault();
        libros.push({
            id: Date.now(),
            numero: libros.length + 1,
            titulo: document.getElementById("reg-titulo").value,
            autor: document.getElementById("reg-autor").value,
            paginas: Number(document.getElementById("reg-paginas").value) || 0,
            inicio: document.getElementById("reg-inicio").value,
            final: document.getElementById("reg-final").value,
            anio: Number(document.getElementById("reg-anio").value),
            mes: document.getElementById("reg-mes").value,
            estado: document.getElementById("reg-estado").value,
            rating: Number(document.getElementById("reg-rating").value),
            portada: "images/libro-default.jpg"
        });
        guardarEnLocalStorage();
        mostrarRegistro(Number(document.getElementById("reg-anio").value));
    });
}

// --- ADAPTACIONES ---
function mostrarAdaptaciones() {
    const contenido = document.getElementById("contenido");
    let botonesHTML = adaptaciones.map(ad => `<button class="autor-btn-item" onclick="verDetalleAdaptacion(${ad.id})">${ad.titulo}</button>`).join('') || '<p>No hay adaptaciones.</p>';

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
                            <div class="adaptacion-info-fila">AÑO: <span>${ad.anioPelicula}</span></div>
                            <div class="adaptacion-info-fila">PLATAFORMA: <span>${ad.plataforma}</span></div>
                        </div>
                    </div>
                    <div class="adaptacion-divisor-vertical"></div>
                    <div class="adaptacion-columna-media">
                        <img src="${ad.portadaLibro}" class="adaptacion-poster" onerror="this.src='images/libro-default.jpg'">
                        <div class="adaptacion-estrellas-fila">${generarEstrellas(ad.ratingLibro)}</div>
                        <div class="adaptacion-info-detalles">
                            <div class="adaptacion-info-fila">AÑO: <span>${ad.anioLibro}</span></div>
                            <div class="adaptacion-info-fila">AUTOR/A: <span>${ad.autor}</span></div>
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
            <label>Título</label><input type="text" id="ad-titulo" required>
            <label>Autor</label><input type="text" id="ad-autor">
            <label>Año libro</label><input type="number" id="ad-anil">
            <label>Año película</label><input type="number" id="ad-anip">
            <label>Plataforma</label><input type="text" id="ad-plat">
            <button type="submit">Guardar</button>
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

// Carga inicial
window.onload = () => { mostrarPagina('inicio'); };
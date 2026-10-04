const libros = [

    {
        id: 1,
        titulo: "Libro de ejemplo 1",
        autor: "Autor de ejemplo",
        paginas: 350,
        estado: "Leído",
        rating: 5,
        genero: "Romance",
        
    },

    {
        id: 2,
        titulo: "Libro de ejemplo 2",
        autor: "Autor de ejemplo",
        paginas: 280,
        estado: "Leyendo",
        rating: 4,
        genero: "Fantasía",
        
    },

    {
        id: 3,
        titulo: "Libro de ejemplo 3",
        autor: "Autor de ejemplo",
        paginas: 420,
        estado: "Por leer",
        rating: 0,
        genero: "Misterio",
       
    }

];
function generarEstrellas(rating) {

    let estrellas = "";

    for (let i = 1; i <= 5; i++) {

        if (i <= rating) {

            estrellas += "★";

        } else {

            estrellas += "☆";

        }

    }

    return estrellas;

function mostrarLibro(id) {

    const libro =
        libros.find(libro => libro.id === id);


    const contenido =
        document.getElementById("contenido");


    contenido.innerHTML = `

        <button
            onclick="mostrarLibros()"
            class="boton-volver"
        >
            ← Volver
        </button>


        <div class="detalle-libro">

            <img
                src="${libro.portada}"
                alt="${libro.titulo}"
                class="portada-detalle"
            >


            <div>

                <h2>
                    ${libro.titulo}
                </h2>

                <h3>
                    ${libro.autor}
                </h3>

                <p class="estrellas">
                    ${generarEstrellas(libro.rating)}
                </p>

                <p>
                    📖 ${libro.paginas} páginas
                </p>

                <p>
                    📚 ${libro.estado}
                </p>

                <p>
                    🏷️ ${libro.genero}
                </p>

            </div>

        </div>


        <section class="seccion-libro">

            <h3>📝 Mi reseña</h3>

            <p>
                Aquí escribiremos la reseña.
            </p>

        </section>


        <section class="seccion-libro">

            <h3>💬 Citas favoritas</h3>

            <p>
                Aquí aparecerán las citas.
            </p>

        </section>

    `;

}

function mostrarPagina(pagina) {

    const contenido =
        document.getElementById("contenido");


    if (pagina === "inicio") {

        contenido.innerHTML = `

            <h2>🏠 Bienvenida</h2>

            <p>
                Bienvenida a tu Book Journal.
            </p>

        `;

    }


    else if (pagina === "libreria") {

        contenido.innerHTML = `

            <h2>📚 Mi Librería</h2>

            <p>
                Aquí aparecerán tus libros.
            </p>

        `;

    }


    else if (pagina === "estanterias") {

        contenido.innerHTML = `

            <h2>📖 Estanterías</h2>

            <p>
                Aquí estarán tus categorías.
            </p>

        `;

    }


    else if (pagina === "resenas") {

        contenido.innerHTML = `

            <h2>⭐ Reseñas</h2>

            <p>
                Aquí aparecerán tus reseñas.
            </p>

        `;

    }


    else if (pagina === "favorito") {

        contenido.innerHTML = `

            <h2>💚 Favorito del mes</h2>

            <p>
                Aquí aparecerá tu favorito.
            </p>

        `;

    }


    else if (pagina === "tracker") {

        contenido.innerHTML = `

            <h2>📅 Reading Tracker</h2>

            <p>
                Aquí llevarás tu seguimiento.
            </p>

        `;

    }


    else if (pagina === "citas") {

        contenido.innerHTML = `

            <h2>💬 Citas</h2>

            <p>
                Aquí guardarás tus citas favoritas.
            </p>

        `;

    }


    else if (pagina === "autores") {

        contenido.innerHTML = `

            <h2>👩 Autores</h2>

            <p>
                Aquí estarán tus autores.
            </p>

        `;

    }


    else if (pagina === "registro") {

        contenido.innerHTML = `

            <h2>📝 Registro de libros</h2>

            <p>
                Aquí podrás registrar libros.
            </p>

        `;

    }


    else if (pagina === "adaptaciones") {

        contenido.innerHTML = `

            <h2>🎬 Adaptaciones</h2>

            <p>
                Aquí estarán las adaptaciones.
            </p>

        `;

    }


    else if (pagina === "recap") {

        contenido.innerHTML = `

            <h2>📊 Recap mensual</h2>

            <p>
                Aquí estarán tus estadísticas.
            </p>

        `;

    }

}
function mostrarRegistro() {

    const contenido =
        document.getElementById("contenido");


    contenido.innerHTML = `

        <h2>📝 Registrar libro</h2>


        <form
            id="formulario-libro"
            class="formulario-libro"
        >

            <label>
                Título
            </label>

            <input
                type="text"
                id="titulo"
                required
            >


            <label>
                Autor
            </label>

            <input
                type="text"
                id="autor"
                required
            >


            <label>
                Páginas
            </label>

            <input
                type="number"
                id="paginas"
                min="1"
            >


            <label>
                Género
            </label>

            <input
                type="text"
                id="genero"
            >


            <label>
                Estado
            </label>

            <select id="estado">

                <option value="Por leer">
                    Por leer
                </option>

                <option value="Leyendo">
                    Leyendo
                </option>

                <option value="Leído">
                    Leído
                </option>

                <option value="Pausado">
                    Pausado
                </option>

                <option value="Abandonado">
                    Abandonado
                </option>

            </select>


            <label>
                Calificación
            </label>

            <select id="rating">

                <option value="0">Sin calificar</option>

                <option value="1">★</option>

                <option value="2">★★</option>

                <option value="3">★★★</option>

                <option value="4">★★★★</option>

                <option value="5">★★★★★</option>

            </select>


            <button type="submit">

                Guardar libro

            </button>

        </form>

    `;


    document
        .getElementById("formulario-libro")
        .addEventListener(
            "submit",
            guardarLibro
        );

}
function guardarLibro(event) {

    event.preventDefault();


    const nuevoLibro = {

        id: Date.now(),

        titulo:
            document.getElementById("titulo").value,

        autor:
            document.getElementById("autor").value,

        paginas:
            Number(
                document.getElementById("paginas").value
            ),

        genero:
            document.getElementById("genero").value,

        estado:
            document.getElementById("estado").value,

        rating:
            Number(
                document.getElementById("rating").value
            ),

        portada:
            "images/libro-default.jpg"

    };


    libros.push(nuevoLibro);


    alert("Libro agregado correctamente");


    mostrarLibros();

}
function mostrarTracker() {

    const contenido =
        document.getElementById("contenido");

    contenido.innerHTML = `

        <div class="tracker">

            <h2>📅 Reading Tracker</h2>

            <div class="tracker-controles">

                <button onclick="cambiarMes(-1)">
                    ←
                </button>

                <h3 id="mes-actual"></h3>

                <button onclick="cambiarMes(1)">
                    →
                </button>

            </div>

            <div
                id="calendario"
                class="calendario"
            ></div>

        </div>

    `;

    generarCalendario();

}
let fechaTracker = new Date();
function generarCalendario() {

    const calendario =
        document.getElementById("calendario");

    const tituloMes =
        document.getElementById("mes-actual");


    const año =
        fechaTracker.getFullYear();

    const mes =
        fechaTracker.getMonth();


    const nombreMes =
        fechaTracker.toLocaleDateString(
            "es-MX",
            {
                month: "long",
                year: "numeric"
            }
        );


    tituloMes.textContent =
        nombreMes.toUpperCase();


    const primerDia =
        new Date(año, mes, 1).getDay();


    const diasMes =
        new Date(año, mes + 1, 0).getDate();


    let html = `

        <div class="dia-semana">L</div>
        <div class="dia-semana">M</div>
        <div class="dia-semana">M</div>
        <div class="dia-semana">J</div>
        <div class="dia-semana">V</div>
        <div class="dia-semana">S</div>
        <div class="dia-semana">D</div>

    `;


    let inicio =
        primerDia === 0
            ? 6
            : primerDia - 1;


    for (let i = 0; i < inicio; i++) {

        html += `
            <div class="dia vacio"></div>
        `;

    }


    for (
        let dia = 1;
        dia <= diasMes;
        dia++
    ) {

        html += `

            <button
                class="dia"
                onclick="seleccionarDia(${dia})"
            >

                ${dia}

            </button>

        `;

    }


    calendario.innerHTML = html;

}

function cambiarMes(valor) {

    fechaTracker.setMonth(
        fechaTracker.getMonth() + valor
    );

    generarCalendario();

}

function seleccionarDia(dia) {

    const año =
        fechaTracker.getFullYear();

    const mes =
        fechaTracker.getMonth() + 1;


    alert(
        `Seleccionaste el día ${dia}/${mes}/${año}`
    );

}

const citas = [];
function mostrarCitas() {

    const contenido =
        document.getElementById("contenido");


    let htmlCitas = "";


    if (citas.length === 0) {

        htmlCitas = `

            <p>
                Todavía no tienes citas guardadas.
            </p>

        `;

    } else {

        citas.forEach(cita => {

            htmlCitas += `

                <div class="tarjeta-cita">

                    <blockquote>
                        "${cita.texto}"
                    </blockquote>

                    <p>
                        📖 ${cita.libro}
                    </p>

                    <p>
                        ✍️ ${cita.autor}
                    </p>

                    <p>
                        Página: ${cita.pagina}
                    </p>

                </div>

            `;

        });

    }


    contenido.innerHTML = `

        <h2>💬 Mis citas</h2>

        <button
            onclick="mostrarFormularioCita()"
            class="boton-principal"
        >
            + Nueva cita
        </button>

        <div class="lista-citas">

            ${htmlCitas}

        </div>

    `;

}

function mostrarFormularioCita() {

    const contenido =
        document.getElementById("contenido");


    contenido.innerHTML = `

        <h2>💬 Nueva cita</h2>

        <form
            id="form-cita"
            class="formulario-libro"
        >

            <label>
                Cita
            </label>

            <textarea
                id="texto-cita"
                required
            ></textarea>


            <label>
                Libro
            </label>

            <input
                type="text"
                id="libro-cita"
                required
            >


            <label>
                Autor
            </label>

            <input
                type="text"
                id="autor-cita"
            >


            <label>
                Página
            </label>

            <input
                type="number"
                id="pagina-cita"
            >


            <button type="submit">
                Guardar cita
            </button>

        </form>

    `;


    document
        .getElementById("form-cita")
        .addEventListener(
            "submit",
            guardarCita
        );

}
function guardarCita(event) {

    event.preventDefault();


    const cita = {

        texto:
            document.getElementById(
                "texto-cita"
            ).value,

        libro:
            document.getElementById(
                "libro-cita"
            ).value,

        autor:
            document.getElementById(
                "autor-cita"
            ).value,

        pagina:
            document.getElementById(
                "pagina-cita"
            ).value

    };


    citas.push(cita);


    mostrarCitas();

}

const autores = [
    {
        id: 1,
        nombre: "Autor de ejemplo",
        libros: 3,
        foto: "images/autor1.jpg"
    }
];

function mostrarAutores() {

    const contenido =
        document.getElementById("contenido");


    let tarjetas = "";


    autores.forEach(autor => {

        tarjetas += `

            <div class="tarjeta-autor">

                <img
                    src="${autor.foto}"
                    alt="${autor.nombre}"
                >

                <h3>
                    ${autor.nombre}
                </h3>

                <p>
                    ${autor.libros} libros
                </p>

            </div>

        `;

    });


    contenido.innerHTML = `

        <h2>👩 Autores</h2>

        <div class="lista-autores">

            ${tarjetas}

        </div>

    `;

}

const adaptaciones = [];
function mostrarAdaptaciones() {

    const contenido =
        document.getElementById("contenido");


    let html = "";


    if (adaptaciones.length === 0) {

        html = `

            <p>
                No tienes adaptaciones registradas.
            </p>

        `;

    } else {

        adaptaciones.forEach(adaptacion => {

            html += `

                <div class="tarjeta-adaptacion">

                    <h3>
                        ${adaptacion.libro}
                    </h3>

                    <p>
                        🎬 ${adaptacion.titulo}
                    </p>

                    <p>
                        📅 ${adaptacion.año}
                    </p>

                    <p>
                        📺 ${adaptacion.plataforma}
                    </p>

                </div>

            `;

        });

    }


    contenido.innerHTML = `

        <h2>🎬 Adaptaciones</h2>

        <div class="lista-adaptaciones">

            ${html}

        </div>

    `;

}

function mostrarRecap() {

    const contenido =
        document.getElementById("contenido");


    const librosLeidos =
        libros.filter(
            libro =>
                libro.estado === "Leído"
        );


    const cantidad =
        librosLeidos.length;


    const paginas =
        librosLeidos.reduce(
            (total, libro) =>
                total + libro.paginas,
            0
        );


    let promedio = 0;


    if (cantidad > 0) {

        promedio =
            librosLeidos.reduce(
                (total, libro) =>
                    total + libro.rating,
                0
            ) / cantidad;

    }


    contenido.innerHTML = `

        <div class="recap">

            <h2>
                📊 Recap de lectura
            </h2>


            <div class="estadisticas">

                <div class="estadistica">

                    <span>📚</span>

                    <strong>
                        ${cantidad}
                    </strong>

                    <small>
                        Libros leídos
                    </small>

                </div>


                <div class="estadistica">

                    <span>📖</span>

                    <strong>
                        ${paginas}
                    </strong>

                    <small>
                        Páginas
                    </small>

                </div>


                <div class="estadistica">

                    <span>⭐</span>

                    <strong>
                        ${promedio.toFixed(1)}
                    </strong>

                    <small>
                        Promedio
                    </small>

                </div>

            </div>

        </div>

    `;

}

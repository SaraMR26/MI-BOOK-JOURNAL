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
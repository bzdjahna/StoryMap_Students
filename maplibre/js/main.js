document.addEventListener('DOMContentLoaded', () => {
    // Crear el mapa
    const map = new maplibregl.Map({
        container: 'map', // ID del contenedor HTML
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // Estilo básico
        center: [-74.219, -13.1615], // Coordenadas iniciales (ej. Ayacucho)
        zoom: 14// Nivel de zoom inicial,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-left');

    const markers = []; // Almacena los marcadores para referencia

    // Cargar el GeoJSON
    fetch('data/processed/storymap_ptos.geojson') // Asegúrate de que la ruta sea correcta
        .then(response => response.json())
        .then(data => {
            data.features.forEach((feature, index) => {
                const coordinates = feature.geometry.coordinates;

                // Crear un marcador
                const marker = new maplibregl.Marker()
                    .setLngLat(coordinates)
                    .addTo(map);

                // Validar que los atributos del popup estén definidos
                if (feature.properties.nro && feature.properties.title) {
                    // Crear un popup como label con información del GeoJSON
                    const popup = new maplibregl.Popup({ offset: 25, closeOnClick: false, closeButton: false })
                        .setHTML(`<h3>${feature.properties.title}</h3>`);

                    // Asignar el popup al marcador
                    marker.setPopup(popup).togglePopup();
                }

                // Almacenar el marcador y sus coordenadas
                markers.push({ marker, coordinates });

                // Evento de clic en el marcador
                marker.getElement().addEventListener('click', () => {
                    scrollToSection(index + 1); // Ajustar para ignorar el panel inicial
                });

                // Añadir imagen al contenedor de imágenes si el atributo `image` está definido
                if (feature.properties.image) {
                    const imageContainer = document.getElementById('scrollable-images');
                    const imagePanel = document.createElement('div');
                    imagePanel.className = 'image-panel panel';
                    imagePanel.innerHTML = `<img src="${feature.properties.image}" alt="Imagen de ${feature.properties.id}">`;
                    imageContainer.appendChild(imagePanel);
                }

                // Añadir texto al contenedor de textos si los atributos están definidos
                if (feature.properties.id && feature.properties.text) {
                    const textContainer = document.getElementById('scrollable-texts');
                    const textPanel = document.createElement('div');
                    textPanel.className = 'text-panel panel';
                    textPanel.innerHTML = `<p>${feature.properties.id}</p><hr class="custom-hr"><p>${feature.properties.text}</p>`;
                    textContainer.appendChild(textPanel);
                }
            });

            // Añadir una sección de Referencias o Agradecimientos después del último marcador
            addReferencesSection();
        })
        .catch(error => {
            console.error('Error al cargar el GeoJSON:', error);
        });


    // Cargar el GeoJSON de líneas
    fetch('data/processed/storymap_lines.geojson')  // Asegúrate de que la ruta sea correcta
        .then(response => response.json())
        .then(data => {
            // Esperar a que el mapa cargue completamente
            map.on('load', () => {
                // Agregar la fuente de las líneas
                map.addSource('lineas', {
                    'type': 'geojson',
                    'data': data
                });

                // Agregar una capa para dibujar las líneas
                map.addLayer({
                    'id': 'lineas-layer',
                    'type': 'line', // Especificamos que es una capa de tipo línea
                    'source': 'lineas', // Referenciamos la fuente que acabamos de agregar
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': '#6c757d',  // Cambia esto para ajustar el color de la línea
                        'line-width': 2  // Ajusta el grosor de la línea
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar el GeoJSON de líneas:', error);
        });

    // Sincronización de scroll
    const imageContainer = document.getElementById('scrollable-images');
    const textContainer = document.getElementById('scrollable-texts');


    imageContainer.addEventListener('scroll', () => {
        textContainer.scrollTop = imageContainer.scrollTop;
        updateMapOnScroll(imageContainer.scrollTop); // Actualiza el mapa en función del scroll
        checkScrollPosition(imageContainer); // Verifica si el scroll está al inicio
    });

    textContainer.addEventListener('scroll', () => {
        imageContainer.scrollTop = textContainer.scrollTop;
        updateMapOnScroll(textContainer.scrollTop); // Actualiza el mapa en función del scroll
        checkScrollPosition(textContainer); // Verifica si el scroll está al inicio
    });

    // Función para desplazarse a la sección
    function scrollToSection(index) {
        const textPanels = document.querySelectorAll('.text-panel');
        const imagePanels = document.querySelectorAll('.image-panel');

        // Desplazarse suavemente al panel de texto correspondiente
        textPanels[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        imagePanels[index].scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Volar hacia el marcador
        if (index - 1 >= 0) {
            map.flyTo({
                center: markers[index - 1].coordinates, // Ajustamos aquí para que coincida con el índice de marcadores
                zoom: 14,
                essential: true // Esta opción asegura que el vuelo se complete
            });
        }

        // Sincronizar el scroll entre los contenedores
        // Ajustar el scroll para que el panel de texto e imagen se posicionen correctamente
        textContainer.scrollTop = textPanels[index].offsetTop;
        imageContainer.scrollTop = imagePanels[index].offsetTop;
    }

    // Actualiza el mapa basado en la posición del scroll
    function updateMapOnScroll(scrollTop) {
        const imagePanels = document.querySelectorAll('.image-panel');
        const textPanels = document.querySelectorAll('.text-panel');

        for (let i = 1; i < imagePanels.length; i++) { // Empieza en 1 para ignorar el primer panel
            const imagePanel = imagePanels[i];
            const textPanel = textPanels[i];

            // Calcula las posiciones del panel
            const imagePanelTop = imagePanel.offsetTop;
            const imagePanelHeight = imagePanel.offsetHeight;
            const textPanelTop = textPanel.offsetTop;
            const textPanelHeight = textPanel.offsetHeight;

            // Verifica si el scroll está en el rango de este panel
            if (scrollTop >= imagePanelTop && scrollTop < (imagePanelTop + imagePanelHeight)) {
                map.flyTo({
                    center: markers[i - 1].coordinates, // Ajustamos para que coincida con los marcadores
                    zoom: 16,
                    essential: true
                });
                break; // Salir del bucle una vez que encontramos el panel activo
            }
        }
    }

    // Verifica si el scroll está al inicio y restablece el mapa
    function checkScrollPosition(container) {
        if (container.scrollTop === 0) {
            // Restablecer el mapa a su estado inicial
            map.flyTo({
                center: [-74.219, -13.1615], // Coordenadas iniciales
                zoom: 14, // Nivel de zoom inicial
                essential: true
            });
            container.scrollTop = 0;
        }
    }

    // Función para restaurar el estado inicial del mapa y el scroll
    function resetToInitialState() {
        // Restablecer el mapa a su vista inicial
        map.flyTo({
            center: [-74.219, -13.1615], // Coordenadas iniciales
            zoom: 14,
            essential: true
        });

        // Restablecer el scroll al inicio (panel de presentación)
        textContainer.scrollTop = 0;
        imageContainer.scrollTop = 0;
    }

    // Función para añadir la sección de "Referencias" o "Agradecimientos"
    function addReferencesSection() {
        // Añadir panel de agradecimientos en el contenedor de textos
        const textContainer = document.getElementById('scrollable-texts');
        const textPanel = document.createElement('div');
        textPanel.className = 'text-panel panel';
        textPanel.innerHTML = `
        <h1>Agradecimientos</h1>
        <div class="image-container">
            ${createCollaborator('Diana Mogrovejo (Researcher)', 'img/diana.jpg', 'https://www.linkedin.com/in/diana-mogrovejo-3a72b493/', 'https://x.com', 'https://github.com/bzdjahna', 'colab-1')}
            ${createCollaborator('Antony Barja (GIS Web Developer)', 'https://avatars.githubusercontent.com/u/23284899?s=400&u=a4f50618c8abfb1f7d334db5c9cabffbb4c3f5c7&v=4', 'https://www.linkedin.com/in/antonybarja/', 'https://x.com/antony_barja', 'https://github.com/ambarja', 'colab-2')}
            ${createCollaborator('Sebastian Quispe (Artist)', 'img/sebastian.jpg', 'https://www.instagram.com/vidr_000/', 'https://x.com', 'https://github.com', 'colab-3')}
            ${createCollaborator('Cristina Zavala (Artist)', 'img/cristina.jpg', 'https://www.instagram.com/otra_sarah/', 'https://x.com', 'https://github.com', 'colab-3')}
        </div>
        <br>
        <img src="img/university.svg" width='60%'>
    `;

        textContainer.appendChild(textPanel);

        // Añadir panel de agradecimientos en el contenedor de imágenes (opcional)
        const imageContainer = document.getElementById('scrollable-images');
        const imagePanel = document.createElement('div');
        imagePanel.className = 'image-panel panel';
        imagePanel.innerHTML = `<img src="https://nuevasnarrativasec.github.io/tablas-de-sarhua/img/flor.webp" alt="Imagen de Agradecimientos"><br><h3>Copyright © 2022 by Diana Mogrovejo</h3>`;
        imageContainer.appendChild(imagePanel);

        // Añadir el botón "Volver al Inicio" al final de la sección de agradecimientos
        const resetButton = document.createElement('button');
        resetButton.className = 'reset-button'; // Cambiado a clase para evitar conflictos
        resetButton.innerText = 'Volver al Inicio';
        textPanel.appendChild(resetButton);

        // Evento al hacer clic en el botón de reinicio
        resetButton.addEventListener('click', resetToInitialState);
    }

    // Función para crear cada colaborador con su imagen, nombre e iconos
    function createCollaborator(name, imgSrc, linkedinUrl, xUrl, githubUrl, id) {
        return `
        <div class="collaborator">
            <img src="${imgSrc}" alt="Imagen de ${name}" class="circle-img" id="${id}">
            <p class="collaborator-name" style='font-size:1.1rem;'>${name}</p>
            <div class="social-icons">
                <a href="${linkedinUrl}" target="_blank"><i class="fab fa-linkedin"></i></a>
                <a href="${xUrl}" target="_blank"><i class="bi bi-twitter-x"></i></a>
                <a href="${githubUrl}" target="_blank"><i class="fab fa-github"></i></a>
            </div>
        </div>
        <br>
    `;
    }
});
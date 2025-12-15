// ================================
// Utilitats d'hora
// ================================

// Hora actual en format HH:MM
function getCurrentTime() {
    const currentDate = new Date();
    return currentDate.toTimeString().slice(0, 5);
}

// Correcció d'hores > 24 (ex: 24:25 -> 00:25)
function corregirHora(horaStr) {
    if (!horaStr) return '';
    let [hores, minuts] = horaStr.split(':').map(Number);
    if (hores >= 24) {
        hores -= 24;
    }
    return `${hores.toString().padStart(2, '0')}:${minuts.toString().padStart(2, '0')}`;
}

// Converteix HH:MM a minuts, gestionant pas de mitjanit
function timeToMinutes(timeStr) {
    const [hh, mm] = timeStr.split(':').map(Number);
    let total = hh * 60 + mm;
    return total < 240 ? total + 1440 : total;
}

// ================================
// Obtenció de dades (NOVA API v2.1)
// ================================

async function fetchTrainData(stationCode, trainCount, selectedTime, lineName) {
    // Nova API base
    const baseUrl = 'https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/viajes-de-hoy/records';

    // Filtre per stop_id
    // Filtre per stop_id (comportament anterior)
    let url = `${baseUrl}?limit=100&where=stop_id="${stationCode}"`;

    try {
        let response = await fetch(url);
        let data = await response.json();

        // Si no hi ha resultats i l'estació és NA, busquem per nom
        if (stationCode.toUpperCase() === 'NA' && (!data.results || data.results.length === 0)) {
            url = `${baseUrl}?limit=100&where=stop_name in ("Abrera","NACIONS UNIDES","Nacions Unides")`;
            response = await fetch(url);
            data = await response.json();
        }

        // Hora de referència
        const currentTime = selectedTime || getCurrentTime();
        const [h, m] = currentTime.split(':').map(Number);
        let horaIniciMin = h * 60 + m;
        if (horaIniciMin < 240) horaIniciMin += 1440;

        if (data.results && data.results.length > 0) {
            const upcomingTrains = data.results
                .filter(train => train.departure_time)
                .filter(train => timeToMinutes(train.departure_time) >= horaIniciMin)
                .filter(train => lineName === '' || train.route_short_name.toLowerCase() === lineName.toLowerCase())
                .sort((a, b) => timeToMinutes(a.departure_time) - timeToMinutes(b.departure_time));

            displayTrains(upcomingTrains, trainCount);
        } else {
            showNoTrains('No s\'han trobat trens disponibles');
        }

    } catch (error) {
        console.error('Error obtenint dades de la nova API:', error);
        showNoTrains('Error en obtenir les dades');
    }
}

// ================================
// Renderització
// ================================

function displayTrains(trains, trainCount) {
    const scheduleDiv = document.getElementById('train-schedule');
    scheduleDiv.innerHTML = '';

    trains.slice(0, trainCount).forEach(train => {
        const trainDiv = document.createElement('div');
        trainDiv.className = 'train';

        const lineIcon = document.createElement('div');
        lineIcon.className = `line-icon ${train.route_short_name.toLowerCase()}`;
        lineIcon.textContent = train.route_short_name;

        const destination = document.createElement('div');
        destination.className = 'destination';
        destination.textContent = train.trip_headsign;

        const time = document.createElement('div');
        time.className = 'time';
        time.textContent = corregirHora(train.departure_time);

        trainDiv.appendChild(lineIcon);
        trainDiv.appendChild(destination);
        trainDiv.appendChild(time);

        scheduleDiv.appendChild(trainDiv);
    });
}

function showNoTrains(message) {
    const scheduleDiv = document.getElementById('train-schedule');
    scheduleDiv.innerHTML = `<div class="no-trains">${message}</div>`;
}

// ================================
// Formulari
// ================================

document.getElementById('station-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const stationCode = document.getElementById('station-code').value;
    const trainCount = document.getElementById('train-count').value;
    const lineName = document.getElementById('line-name').value;
    let selectedTime = document.getElementById('selected-time').value;

    if (!selectedTime) {
        selectedTime = getCurrentTime();
    }

    document.getElementById('station-name').textContent = stationCode;

    fetchTrainData(stationCode, trainCount, selectedTime, lineName);
});

// Any actual
document.getElementById('current-year').textContent = new Date().getFullYear();

// forecast.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize map centered on Phoenix
    const map = L.map('map').setView([33.4484, -112.0740], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add a marker for Phoenix
    L.marker([33.4484, -112.0740]).addTo(map)
        .bindPopup('Phoenix, AZ')
        .openPopup();

    // Load and display AOI boundary
    fetch('aoi.geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: {
                    color: 'blue',
                    weight: 2,
                    fillColor: 'lightblue',
                    fillOpacity: 0.3
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading AOI:', error));

    // Fetch forecast data
    fetchForecastData();
});

async function fetchForecastData() {
    // Define points in AOI for gridded data (center and corners)
    const aoiPoints = [
        [33.4484, -112.0740], // Phoenix center
        [32.0, -114.0],       // SW corner
        [35.0, -114.0],       // NW corner
        [35.0, -110.0],       // NE corner
        [32.0, -110.0]        // SE corner
    ];

    const results = [];
    for (const point of aoiPoints) {
        const [lat, lon] = point;
        const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;

        try {
            const pointResponse = await fetch(pointUrl, {
                headers: {
                    'User-Agent': 'PhoenixForecastPortal/1.0 (contact@example.com)'
                }
            });
            const pointData = await pointResponse.json();

            const forecastUrl = pointData.properties.forecast;
            const forecastResponse = await fetch(forecastUrl, {
                headers: {
                    'User-Agent': 'PhoenixForecastPortal/1.0 (contact@example.com)'
                }
            });
            const forecastData = await forecastResponse.json();

            results.push({ lat, lon, data: forecastData });
        } catch (error) {
            console.error(`Error fetching for ${lat},${lon}:`, error);
        }

        // Delay to avoid rate limiting (1 second between requests)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const validResults = results.filter(r => r);

    if (validResults.length === 0) {
        document.getElementById('forecast-periods').innerHTML = '<p>Error loading forecast data. Please try again later.</p>';
        return;
    }

    // Use center point for main display
    const centerResult = validResults.find(r => r.lat === 33.4484 && r.lon === -112.0740);
    if (centerResult) {
        displayForecast(centerResult.data);
    }

    // Add markers for all points
    validResults.forEach(result => {
        addForecastMarker(result);
    });
}

function displayForecast(data) {
    const periods = data.properties.periods;
    const container = document.getElementById('forecast-periods');
    container.innerHTML = '';

    periods.forEach(period => {
        const icon = getWeatherIcon(period.shortForecast);
        const div = document.createElement('div');
        div.innerHTML = `
            <h3>${icon} ${period.name}</h3>
            <p>${period.detailedForecast}</p>
            <p>Temperature: ${period.temperature}°${period.temperatureUnit}</p>
            <p>Wind: ${period.windSpeed} ${period.windDirection}</p>
        `;
        container.appendChild(div);
    });

    // Populate table with daily summaries
    const tableBody = document.getElementById('forecast-table-body');
    tableBody.innerHTML = '';

    // Group by day
    const dailyData = {};
    periods.forEach(period => {
        const date = new Date(period.startTime).toDateString();
        if (!dailyData[date]) {
            dailyData[date] = { temps: [], pops: [], winds: [] };
        }
        dailyData[date].temps.push(period.temperature);
        if (period.probabilityOfPrecipitation && period.probabilityOfPrecipitation.value !== null) {
            dailyData[date].pops.push(period.probabilityOfPrecipitation.value);
        }
        dailyData[date].winds.push(period.windSpeed);
    });

    Object.keys(dailyData).forEach(date => {
        const data = dailyData[date];
        const maxTemp = Math.max(...data.temps);
        const minTemp = Math.min(...data.temps);
        const maxPop = data.pops.length > 0 ? Math.max(...data.pops) : 0;
        const wind = data.winds[0]; // Take first wind

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date}</td>
            <td>${maxTemp}°F</td>
            <td>${minTemp}°F</td>
            <td>${maxPop}%</td>
            <td>${wind}</td>
        `;
        tableBody.appendChild(row);
    });
}

function addForecastMarker(result) {
    const { lat, lon, data } = result;
    const periods = data.properties.periods;
    if (periods.length === 0) return;

    const current = periods[0]; // First period
    const icon = getWeatherIcon(current.shortForecast);
    const temp = `${current.temperature}°${current.temperatureUnit}`;
    const pop = current.probabilityOfPrecipitation ? `${current.probabilityOfPrecipitation.value}%` : '0%';

    // Color based on temperature (simple scale)
    let color = 'blue';
    if (current.temperature > 80) color = 'red';
    else if (current.temperature > 60) color = 'orange';
    else if (current.temperature > 40) color = 'yellow';

    const marker = L.circleMarker([lat, lon], {
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        radius: 10
    }).addTo(map);

    marker.bindPopup(`
        <strong>${icon} ${current.name}</strong><br>
        Temp: ${temp}<br>
        PoP: ${pop}<br>
        Wind: ${current.windSpeed} ${current.windDirection}
    `);
}

function getWeatherIcon(shortForecast) {
    const forecast = shortForecast.toLowerCase();
    if (forecast.includes('sunny') || forecast.includes('clear')) return '☀️';
    if (forecast.includes('cloudy') || forecast.includes('overcast')) return '☁️';
    if (forecast.includes('rain') || forecast.includes('shower')) return '🌧️';
    if (forecast.includes('snow')) return '❄️';
    if (forecast.includes('thunder') || forecast.includes('storm')) return '⛈️';
    if (forecast.includes('fog') || forecast.includes('mist')) return '🌫️';
    if (forecast.includes('wind')) return '💨';
    return '🌤️'; // default partly cloudy
}
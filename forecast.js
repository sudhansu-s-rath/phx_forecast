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
    const lat = 33.4484;
    const lon = -112.0740;
    const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;

    try {
        const pointResponse = await fetch(pointUrl, {
            headers: {
                'User-Agent': 'PhoenixForecastPortal/1.0 (contact@example.com)'
            }
        });
        const pointData = await pointResponse.json();

        const forecastGridUrl = pointData.properties.forecastGridData;

async function fetchGridData(gridUrl) {
    // Note: NWS grid data is point-based, not full grid for overlay.
    // For simplicity, we'll skip gridded overlays for now.
    // Instead, we can enhance with icons or other features later.
    console.log('Grid URL:', gridUrl);
}

        // Fetch daily forecast
        const forecastResponse = await fetch(forecastUrl, {
            headers: {
                'User-Agent': 'PhoenixForecastPortal/1.0 (contact@example.com)'
            }
        });
        const forecastData = await forecastResponse.json();

        // Fetch hourly forecast
        const hourlyResponse = await fetch(forecastHourlyUrl, {
            headers: {
                'User-Agent': 'PhoenixForecastPortal/1.0 (contact@example.com)'
            }
        });
        const hourlyData = await hourlyResponse.json();

        displayForecast(forecastData);
        displayHourly(hourlyData);

    } catch (error) {
        console.error('Error fetching forecast data:', error);
        document.getElementById('forecast-periods').innerHTML = '<p>Error loading forecast data.</p>';
    }
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
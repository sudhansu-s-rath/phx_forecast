// forecast.js - Enhanced with NOAA/NWS overlays
document.addEventListener('DOMContentLoaded', function() {
    // Phoenix metro bounding box
    const phoenixBounds = L.latLngBounds(
        [32.0, -114.0],  // Southwest corner
        [35.0, -110.0]   // Northeast corner
    );

    // Initialize map centered on Phoenix
    const map = L.map('map').setView([33.4484, -112.0740], 10);
    
    // Fit to Phoenix bounds
    map.fitBounds(phoenixBounds, { padding: [50, 50] });

    // ============================================
    // Base Layers
    // ============================================
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        name: 'OpenStreetMap'
    }).addTo(map);

    // ============================================
    // NOAA WPC QPF (Precipitation Forecast) Layer
    // WPC provides quantitative precipitation forecast
    // ============================================
    const wpcQpfLayer = L.tileLayer.wms(
        'https://www.wpc.ncep.noaa.gov/tilecache/tilecache.py/1.0.0/ndfd12hr_qpf/default//WebMercatorQuad/',
        {
            layers: '0',
            format: 'image/png',
            transparent: true,
            attribution: 'NOAA Weather Prediction Center',
            opacity: 0.7,
            name: 'NOAA WPC QPF 12hr'
        }
    );

    const wpcQpf24Layer = L.tileLayer.wms(
        'https://www.wpc.ncep.noaa.gov/tilecache/tilecache.py/1.0.0/ndfd24hr_qpf/default//WebMercatorQuad/',
        {
            layers: '0',
            format: 'image/png',
            transparent: true,
            attribution: 'NOAA Weather Prediction Center',
            opacity: 0.7,
            name: 'NOAA WPC QPF 24hr'
        }
    );

    // ============================================
    // NDFD Temperature Layers (NOAA Forecast)
    // National Digital Forecast Database (NDFD)
    // ============================================
    const ndfdMaxTempLayer = L.tileLayer.wms(
        'https://gis.ncdc.noaa.gov/arcgis/rest/services/cdo_ndfd/ndfd_max_temp/MapServer/tile',
        {
            transparent: true,
            attribution: 'NOAA NDFD',
            opacity: 0.6,
            name: 'NDFD Max Temperature'
        }
    );

    const ndfdMinTempLayer = L.tileLayer.wms(
        'https://gis.ncdc.noaa.gov/arcgis/rest/services/cdo_ndfd/ndfd_min_temp/MapServer/tile',
        {
            transparent: true,
            attribution: 'NOAA NDFD',
            opacity: 0.6,
            name: 'NDFD Min Temperature'
        }
    );

    // ============================================
    // Phoenix AOI Boundary Layer
    // ============================================
    let aoiBoundary = null;
    fetch('aoi.geojson')
        .then(response => response.json())
        .then(data => {
            aoiBoundary = L.geoJSON(data, {
                style: {
                    color: '#e74c3c',
                    weight: 3,
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    dashArray: '5, 5'
                },
                name: 'Phoenix AOI'
            }).addTo(map);
        })
        .catch(error => console.error('Error loading AOI:', error));

    // ============================================
    // Add Phoenix Center Marker
    // ============================================
    L.marker([33.4484, -112.0740], {
        title: 'Phoenix Center'
    }).addTo(map)
        .bindPopup('<strong>Phoenix, AZ</strong><br>Metro Center<br>Lat: 33.45°N, Lon: -112.07°W')
        .openPopup();

    // ============================================
    // Layer Control
    // ============================================
    const baseLayers = {
        'OpenStreetMap': osmLayer
    };

    const overlayLayers = {
        'Phoenix AOI Boundary': aoiBoundary || L.featureGroup([]),
        'NOAA WPC QPF 12hr': wpcQpfLayer,
        'NOAA WPC QPF 24hr': wpcQpf24Layer,
        'NDFD Max Temperature': ndfdMaxTempLayer,
        'NDFD Min Temperature': ndfdMinTempLayer
    };

    const layerControl = L.control.layers(baseLayers, overlayLayers, {
        position: 'topright',
        collapsed: false
    }).addTo(map);

    // ============================================
    // Fetch NWS Forecast Data
    // ============================================
    fetchForecastData(map);

    // Store map reference for global use
    window.phoenixMap = map;
});

async function fetchForecastData(map) {
    // Define points in Phoenix metro area for forecast data
    const aoiPoints = [
        [33.4484, -112.0740], // Phoenix center
        [33.4356, -112.0742], // Phoenix downtown
        [33.5331, -112.0661], // Phoenix north
        [33.3127, -112.0765]  // Phoenix south
    ];

    const results = [];
    
    for (const point of aoiPoints) {
        const [lat, lon] = point;
        const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;

        try {
            const pointResponse = await fetch(pointUrl, {
                headers: {
                    'User-Agent': 'PhoenixWeatherForecast/1.0 (research)'
                }
            });
            const pointData = await pointResponse.json();

            if (!pointData.properties || !pointData.properties.forecast) {
                console.warn(`No forecast URL for ${lat},${lon}`);
                continue;
            }

            const forecastUrl = pointData.properties.forecast;
            const forecastResponse = await fetch(forecastUrl, {
                headers: {
                    'User-Agent': 'PhoenixWeatherForecast/1.0 (research)'
                }
            });
            const forecastData = await forecastResponse.json();

            results.push({ lat, lon, data: forecastData });
        } catch (error) {
            console.error(`Error fetching forecast for ${lat},${lon}:`, error);
        }

        // Respectful rate limiting (2 seconds between requests)
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const validResults = results.filter(r => r && r.data && r.data.properties);

    if (validResults.length === 0) {
        document.getElementById('forecast-periods').innerHTML = 
            '<p style="color: #c0392b;">⚠️ Error loading forecast data. NWS API may be temporarily unavailable.</p>';
        return;
    }

    // Use center point for main display
    const centerResult = validResults.find(r => r.lat === 33.4484 && r.lon === -112.0740) || validResults[0];
    if (centerResult) {
        displayForecast(centerResult.data);
    }

    // Add forecast markers on map
    validResults.forEach(result => {
        addForecastMarker(result, map);
    });

    // Update timestamp
    document.getElementById('update-time').textContent = new Date().toLocaleString();
}

function displayForecast(data) {
    const periods = data.properties && data.properties.periods ? data.properties.periods : [];
    
    if (periods.length === 0) {
        document.getElementById('forecast-periods').innerHTML = '<p>No forecast periods available.</p>';
        return;
    }

    const container = document.getElementById('forecast-periods');
    container.innerHTML = '';

    // Display first 6 periods in cards
    periods.slice(0, 6).forEach(period => {
        const icon = getWeatherIcon(period.shortForecast);
        const div = document.createElement('div');
        div.className = 'period-card';
        
        const temp = period.temperature || 'N/A';
        const wind = period.windSpeed || 'Calm';
        const pop = period.probabilityOfPrecipitation && period.probabilityOfPrecipitation.value 
            ? period.probabilityOfPrecipitation.value 
            : '0';
        
        div.innerHTML = `
            <strong>${icon} ${period.name}</strong>
            <p><strong>Temp:</strong> ${temp}°${period.temperatureUnit}</p>
            <p><strong>Wind:</strong> ${wind}</p>
            <p><strong>PoP:</strong> ${pop}%</p>
            <p style="font-size: 12px; margin-top: 8px;">${period.shortForecast}</p>
        `;
        container.appendChild(div);
    });

    // Populate table with daily summaries
    const tableBody = document.getElementById('forecast-table-body');
    tableBody.innerHTML = '';

    // Group by day
    const dailyData = {};
    periods.forEach(period => {
        const date = new Date(period.startTime).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        
        if (!dailyData[date]) {
            dailyData[date] = { temps: [], pops: [], winds: [] };
        }
        
        if (period.temperature !== null && period.temperature !== undefined) {
            dailyData[date].temps.push(period.temperature);
        }
        
        if (period.probabilityOfPrecipitation && period.probabilityOfPrecipitation.value !== null) {
            dailyData[date].pops.push(period.probabilityOfPrecipitation.value);
        }
        
        if (period.windSpeed) {
            dailyData[date].winds.push(period.windSpeed);
        }
    });

    Object.keys(dailyData).slice(0, 10).forEach(date => {
        const dayData = dailyData[date];
        const maxTemp = dayData.temps.length > 0 ? Math.max(...dayData.temps) : 'N/A';
        const minTemp = dayData.temps.length > 0 ? Math.min(...dayData.temps) : 'N/A';
        const maxPop = dayData.pops.length > 0 ? Math.max(...dayData.pops) : 0;
        const wind = dayData.winds.length > 0 ? dayData.winds[0] : 'N/A';

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

function addForecastMarker(result, map) {
    const { lat, lon, data } = result;
    const periods = data.properties && data.properties.periods ? data.properties.periods : [];
    
    if (periods.length === 0) return;

    const current = periods[0]; // First period
    const icon = getWeatherIcon(current.shortForecast);
    const temp = current.temperature !== null && current.temperature !== undefined 
        ? `${current.temperature}°${current.temperatureUnit}` 
        : 'N/A';
    const pop = current.probabilityOfPrecipitation && current.probabilityOfPrecipitation.value !== null
        ? `${current.probabilityOfPrecipitation.value}%` 
        : '0%';
    const wind = current.windSpeed || 'Calm';

    // Color based on temperature
    let color = '#3498db'; // blue
    if (current.temperature !== null && current.temperature !== undefined) {
        if (current.temperature > 100) color = '#c0392b'; // red
        else if (current.temperature > 85) color = '#e74c3c'; // orange-red
        else if (current.temperature > 70) color = '#e67e22'; // orange
        else if (current.temperature > 55) color = '#f39c12'; // yellow-orange
        else if (current.temperature > 40) color = '#3498db'; // blue
        else color = '#2c3e50'; // dark
    }

    const marker = L.circleMarker([lat, lon], {
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        radius: 12,
        weight: 2
    }).addTo(map);

    marker.bindPopup(`
        <strong>${icon} ${current.name}</strong><br>
        <strong>Location:</strong> ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°W<br>
        <strong>Temp:</strong> ${temp}<br>
        <strong>PoP:</strong> ${pop}<br>
        <strong>Wind:</strong> ${wind}
    `);
}

function getWeatherIcon(shortForecast) {
    if (!shortForecast) return '🌤️';
    
    const forecast = shortForecast.toLowerCase();
    
    if (forecast.includes('sunny') || forecast.includes('clear') || forecast.includes('fair')) return '☀️';
    if (forecast.includes('partly cloudy') || forecast.includes('mostly clear')) return '🌤️';
    if (forecast.includes('cloudy') || forecast.includes('overcast') || forecast.includes('mostly cloudy')) return '☁️';
    if (forecast.includes('rain') && forecast.includes('thunder')) return '⛈️';
    if (forecast.includes('rain') || forecast.includes('shower') || forecast.includes('precipitation')) return '🌧️';
    if (forecast.includes('snow')) return '❄️';
    if (forecast.includes('thunder') || forecast.includes('storm')) return '⛈️';
    if (forecast.includes('fog') || forecast.includes('mist')) return '🌫️';
    if (forecast.includes('wind') || forecast.includes('windy')) return '💨';
    
    return '🌤️'; // default
}
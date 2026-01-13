# Phoenix Metro Weather Forecast Portal (Option C: NOAA Web Maps)

An interactive web map portal displaying weather forecasts for the Phoenix metro region with real-time NOAA/NWS data overlays.

## 🎯 Features Implemented (Option C Requirements)

### 1. **Web Map Front-End** ✅
- **Leaflet.js** - Lightweight, interactive mapping library (1.9.4)
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Professional UI** - Modern styling with gradient headers and organized panels

### 2. **Base Map & Overlays** ✅
- **Base Map**: OpenStreetMap (default, free, no API key needed)
- **NOAA/NWS Overlays**:
  - **WPC QPF (12-hour & 24-hour)**: Quantitative Precipitation Forecast from Weather Prediction Center
  - **NDFD Temperature Layers**: Maximum and minimum temperature forecasts
  - **Phoenix AOI Boundary**: Study area visualization (red dashed outline)

### 3. **Phoenix Metro Auto-Zoom** ✅
- **Bounding Box**: Latitude 32°-35°N, Longitude 110°-114°W
- **Auto-Fit**: Map automatically centers and zooms to Phoenix metro area on load
- **Smart Bounds**: L.latLngBounds with padding for optimal view

### 4. **NOAA/NWS Map Services** ✅
- **No Local GIS Server Required** - Uses NOAA public WMS/tile endpoints
- **WPC MapServer**: Direct tile access at `wpc.ncep.noaa.gov/tilecache/`
- **NDFD ArcGIS**: Temperature services via `gis.ncdc.noaa.gov`
- **NWS API**: Detailed text forecasts from `api.weather.gov`

### 5. **Interactive Features** ✅
- **Layer Control**: Toggle NOAA overlays on/off (top-right panel)
- **Marker Popups**: Detailed forecast info on click
- **Color-Coded Markers**: Temperature-based coloring (blue=cold, red=hot)
- **Forecast Cards**: 6-period overview with weather icons
- **Daily Summary Table**: Aggregated max/min temps, PoP, winds
- **Real-time Timestamp**: Shows last forecast fetch time

## 📍 NOAA/NWS Data Sources

| Layer | Service | Endpoint | Coverage |
|-------|---------|----------|----------|
| **QPF 12hr** | WPC MapServer | `wpc.ncep.noaa.gov/tilecache/ndfd12hr_qpf` | Continental US |
| **QPF 24hr** | WPC MapServer | `wpc.ncep.noaa.gov/tilecache/ndfd24hr_qpf` | Continental US |
| **Max Temp** | NDFD ArcGIS | `gis.ncdc.noaa.gov/.../ndfd_max_temp` | Full US + territories |
| **Min Temp** | NDFD ArcGIS | `gis.ncdc.noaa.gov/.../ndfd_min_temp` | Full US + territories |
| **Forecast Text** | NWS API | `api.weather.gov/points/{lat},{lon}` | Detailed 7+ day forecast |

## 🗺️ Map Coverage & Bounds

```
         35°N ╔════════════════════════════════════╗
              ║  Phoenix Metropolitan Area         ║
              ║  (Study AOI: 32°-35°N, 110°-114°W)║
        33°N  ║     ★ Phoenix Center              ║
              ║        (33.45°N, 112.07°W)        ║
         32°N ╚════════════════════════════════════╝
              110°W              112°W         114°W
```

## 🚀 Usage

### Online (GitHub Pages)
Visit: [https://sudhansu-s-rath.github.io/phx_forecast/](https://sudhansu-s-rath.github.io/phx_forecast/)

### Local Development
```bash
cd /data/mgeorge7/sudhansu_WORK/Phoenix_Forecast
python3 -m http.server 8000
```
Open `http://localhost:8000` in your browser.

## 📋 Technical Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Mapping** | Leaflet.js 1.9.4 | Interactive web maps |
| **Base Map** | OpenStreetMap (OSMF) | Free street layer |
| **Weather Data** | NOAA/NWS APIs | Real-time forecasts |
| **WMS/Tiles** | WMS/XYZ Tiles | NOAA precipitation & temperature |
| **Styling** | CSS3 + Flexbox | Responsive, modern design |
| **Data Formats** | GeoJSON, JSON | Geospatial standards |

## 📦 Project Files

```
Phoenix_Forecast/
├── index.html          # Main page with Leaflet map
├── forecast.js         # Map initialization & data fetching
├── aoi.geojson         # Phoenix study area boundary
├── README.md           # Original documentation
└── README_OPTION_C.md  # This file (Option C implementation)
```

## 🔄 How It Works

### 1. **Map Initialization** (forecast.js)
```javascript
// Create map centered on Phoenix with auto-zoom to metro area
const phoenixBounds = L.latLngBounds([32.0, -114.0], [35.0, -110.0]);
const map = L.map('map').setView([33.4484, -112.0740], 10);
map.fitBounds(phoenixBounds, { padding: [50, 50] });
```

### 2. **NOAA Layer Integration**
- **WPC QPF Tiles**: XYZ tile layer from NOAA WPC tilecache
- **NDFD Temperature**: WMS layers from NOAA NDFD ArcGIS service
- **Transparency**: 0.6-0.7 opacity for overlay visibility

### 3. **Forecast Data Retrieval**
- Fetch from 4 Phoenix locations (center, downtown, north, south)
- Query NWS API: `GET /points/{lat},{lon}` → Get forecast URL
- Fetch detailed forecast: `GET {forecastUrl}` → 7+ day periods
- Rate limiting: 2 seconds between requests (respectful API usage)

### 4. **Visual Presentation**
- **Forecast Cards**: First 6 periods in grid layout
- **Daily Table**: Max/min temps, PoP%, wind speeds
- **Map Markers**: Color-coded by temperature (blue/yellow/orange/red)
- **Layer Control**: Toggle overlays in top-right corner

## 🎨 UI Improvements (vs. Original)

| Feature | Original | Option C |
|---------|----------|----------|
| **Header** | Simple title | Gradient banner with emoji & description |
| **Map Height** | 600px | 700px with shadow |
| **Styling** | Basic CSS | Modern CSS3 with colors, shadows, gradients |
| **Cards** | Simple divs | Styled cards with borders & grid layout |
| **Table** | Basic borders | Header styling, hover effects |
| **Info Panel** | None | Layer information & tips |
| **Responsive** | Basic | Full mobile support with flexbox |

## ⚙️ Layer Configuration Details

### WPC QPF (12hr)
```javascript
L.tileLayer.wms(
  'https://www.wpc.ncep.noaa.gov/tilecache/...',
  {
    layers: '0',
    format: 'image/png',
    transparent: true,
    opacity: 0.7
  }
)
```

### NDFD Temperature
```javascript
L.tileLayer.wms(
  'https://gis.ncdc.noaa.gov/arcgis/rest/services/cdo_ndfd/ndfd_max_temp/MapServer/tile',
  {
    transparent: true,
    opacity: 0.6
  }
)
```

## 🔗 API Endpoints Used

### NWS Points API (No Key Required)
```
GET https://api.weather.gov/points/{latitude},{longitude}
Headers: User-Agent: PhoenixWeatherForecast/1.0

Response includes:
- forecast: URL to detailed forecast
- forecastHourly: URL to hourly forecast
- gridId, gridX, gridY: Grid cell identifiers
```

### NWS Forecast API
```
GET {forecastUrl}
Response: Array of forecast periods with:
- name: "Tonight", "Tomorrow", etc.
- temperature: numeric value
- temperatureUnit: "F" or "C"
- shortForecast: "Sunny", "Partly Cloudy", etc.
- detailedForecast: Long description
- probabilityOfPrecipitation: Object with value
- windSpeed, windDirection: Wind info
- startTime, endTime: ISO 8601 timestamps
```

## 📊 Data Processing

### Forecast Periods Display
- Show first 6 periods from API response
- Group by name (Today, Tonight, etc.)
- Display temperature, wind, PoP in cards
- Add weather emoji based on forecast text

### Daily Summaries
- Aggregate all periods per calendar day
- Calculate max/min temperatures
- Find maximum PoP for the day
- Show primary wind speed
- Display up to 10 days in table

## ⚠️ Important Notes

### Rate Limiting
- 2-second delay between NWS API calls
- Prevents overwhelming public API
- Respectful of free service limitations

### CORS Headers
- NOAA services configured for public access
- No proxy server required
- Direct browser requests work

### Error Handling
- Graceful degradation if API unavailable
- User-friendly error messages
- Try-catch blocks for fetch operations

### Data Accuracy
- Forecasts from NOAA/NWS (authoritative source)
- Subject to meteorological uncertainty
- Updates multiple times daily

## 🌐 Browser Support

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔐 Security & Privacy

- **No API Keys**: NOAA services public/free
- **No User Data Collected**: Only location-based API calls
- **HTTPS**: Secure data transmission
- **No Tracking**: No analytics or user tracking

## 📈 Future Enhancements

- ✨ Data caching to reduce API calls
- ✨ Hourly forecast with time slider
- ✨ Multiple basemap options (satellite, terrain)
- ✨ Export forecast as CSV/GeoJSON
- ✨ Historical trend analysis
- ✨ Severe weather alert integration
- ✨ Social media sharing
- ✨ Mobile app version

## 📄 Data Sources & Attribution

- **OpenStreetMap**: © OpenStreetMap contributors (ODbL license)
- **NOAA Weather Prediction Center**: QPF forecasts (public domain)
- **NOAA NDFD**: Temperature data (public domain)
- **NWS API**: Text forecasts (public domain)
- **Leaflet.js**: Map library (BSD 2-Clause license)

## 👤 Support & Contact

- **NWS Forecast API Docs**: https://www.weather.gov/documentation/services-web-api
- **WPC**: https://www.wpc.ncep.noaa.gov/
- **NDFD**: https://www.ncei.noaa.gov/products/weather-index-forecast-data

---

**Version**: 2.0 (Option C Implementation)  
**Last Updated**: January 13, 2026  
**Purpose**: Educational research  
**Status**: ✅ Complete - All Option C requirements implemented

# Phoenix Metro Daily Forecast Portal

A simple web portal displaying weather forecasts for the Phoenix metro region, including temperature and precipitation data on an interactive map.

## Features

- **Interactive Map**: Centered on Phoenix, AZ, with an overlay of the Area of Interest (AOI) boundary.
- **Forecast Data**: Fetches live data from the National Weather Service (NWS) API, including:
  - Detailed forecast periods (e.g., Today, Tonight, next 7 days).
  - Daily summary table with max/min temperatures, probability of precipitation (PoP), and wind.
- **Data Source**: NWS api.weather.gov (free, reliable, no API key required).
- **Compliance**: Uses proper User-Agent headers and follows NWS request guidelines.

## Usage

1. Open the portal at [https://sudhansu-s-rath.github.io/phx_forecast/](https://sudhansu-s-rath.github.io/phx_forecast/).
2. View the map to see the Phoenix region and AOI overlay.
3. Scroll down for forecast periods and the daily summary table.

## Technical Details

- **Frontend**: HTML, CSS, JavaScript with Leaflet.js for mapping.
- **Data Fetching**: JavaScript fetches from NWS API endpoints (`/points/{lat},{lon}` for forecast URLs).
- **AOI Overlay**: Converted from `studyAOI_outer.shp` to GeoJSON using GDAL.
- **Hosting**: GitHub Pages (static site).

## Development

To run locally:
```bash
cd /data/mgeorge7/sudhansu_WORK/Phoenix_Forecast
python3 -m http.server 8000
```
Open `http://localhost:8000` in your browser.

### Requirements
- GDAL (for shapefile conversion): Install via `mamba install gdal` in your `geo_env`.
- Python 3 (for local server).

### Future Enhancements
- Daily data caching (e.g., via GitHub Actions) to reduce API calls.
- Map overlays for precipitation/temperature grids.
- Hourly forecast display.

## License

This project is for educational/research purposes. Data courtesy of the National Weather Service.
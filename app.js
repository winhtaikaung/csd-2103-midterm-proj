// Mock weather data
const weatherIcons = {
    '0': { description: 'Clear sky', icon: 'fa-sun' },
    '1': { description: 'Mainly clear', icon: 'fa-sun' },
    '2': { description: 'Partly cloudy', icon: 'fa-cloud-sun' },
    '3': { description: 'Overcast', icon: 'fa-cloud' },
    '45': { description: 'Fog', icon: 'fa-smog' },
    '48': { description: 'Depositing rime fog', icon: 'fa-smog' },
    '51': { description: 'Drizzle: Light intensity', icon: 'fa-cloud-rain' },
    '53': { description: 'Drizzle: Moderate intensity', icon: 'fa-cloud-rain' },
    '55': { description: 'Drizzle: Dense intensity', icon: 'fa-cloud-rain' },
    '56': { description: 'Freezing Drizzle: Light intensity', icon: 'fa-snowflake' },
    '57': { description: 'Freezing Drizzle: Dense intensity', icon: 'fa-snowflake' },
    '61': { description: 'Rain: Slight intensity', icon: 'fa-cloud-showers-heavy' },
    '63': { description: 'Rain: Moderate intensity', icon: 'fa-cloud-showers-heavy' },
    '65': { description: 'Rain: Heavy intensity', icon: 'fa-cloud-showers-heavy' },
    '66': { description: 'Freezing Rain: Light intensity', icon: 'fa-snowflake' },
    '67': { description: 'Freezing Rain: Heavy intensity', icon: 'fa-snowflake' },
    '71': { description: 'Snow fall: Slight intensity', icon: 'fa-snowflake' },
    '73': { description: 'Snow fall: Moderate intensity', icon: 'fa-snowflake' },
    '75': { description: 'Snow fall: Heavy intensity', icon: 'fa-snowflake' },
    '77': { description: 'Snow grains', icon: 'fa-snowflake' },
    '80': { description: 'Rain showers: Slight intensity', icon: 'fa-cloud-showers-heavy' },
    '81': { description: 'Rain showers: Moderate intensity', icon: 'fa-cloud-showers-heavy' },
    '82': { description: 'Rain showers: Violent intensity', icon: 'fa-cloud-showers-heavy' },
    '85': { description: 'Snow showers: Slight intensity', icon: 'fa-snowflake' },
    '86': { description: 'Snow showers: Heavy intensity', icon: 'fa-snowflake' },
    '95': { description: 'Thunderstorm: Slight intensity', icon: 'fa-bolt' },
    '96': { description: 'Thunderstorm with slight hail', icon: 'fa-bolt' },
    '99': { description: 'Thunderstorm with heavy hail', icon: 'fa-bolt' }
};

class WeatherDashboard {
    constructor() {
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.setupEventListeners();
        this.loadFavorites();
        this.loadThemes();
        this.setupDialog();
    }

    setupEventListeners() {
        $('#searchBtn').click(() => this.searchWeather());
        $('#favoriteBtn').click(() => this.toggleFavorite());
        $('#settingsBtn').click(() => $('#settingsDialog').dialog('open'));
        $('#cityInput').on('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeather();
        });
    }

    setupDialog() {
        $('#settingsDialog').dialog({
            autoOpen: false,
            width: 400,
            modal: true,
            buttons: {
                "Save": () => this.saveSettings(),
                "Cancel": function () {
                    $(this).dialog("close");
                }
            }
        });

        // Setup color picker events
        $('input[type="color"]').on('change', (e) => {
            const prop = e.target.id;
            document.documentElement.style.setProperty(`--${prop}`, e.target.value);
        });
    }

    async searchWeather() {
        const city = $('#cityInput').val().trim();
        if (!this.validateCity(city)) return;

        this.showLoading();
        try {
            // In real implementation, this would be an API call
            const geocodeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`, {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site"
                },
                "referrer": "https://open-meteo.com/",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "omit"
            });
            const data = await geocodeResponse.json()
            const geoData = data.results?.at(0)

            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geoData.latitude}&longitude=${geoData.longitude}&current=weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,rain_sum,showers_sum,snowfall_sum&timezone=America%2FNew_York`)
            const jsonResponse = await weatherResponse.json()
            const mockWeatherData = {
                current: {
                    temp: jsonResponse?.daily?.temperature_2m_max[0],
                    humidity: 0, // You can include humidity data if available in the original JSON
                    conditions: jsonResponse?.daily?.weather_code[0],
                    icon: weatherIcons[jsonResponse?.daily?.weather_code[0]]?.icon
                },
                forecast: jsonResponse?.daily?.time.slice(1).map((date, index) => ({
                    date: date,
                    temp: jsonResponse?.daily?.temperature_2m_max[index + 1],
                    conditions: jsonResponse?.daily?.weather_code[index + 1],
                    icon: weatherIcons[jsonResponse?.daily?.weather_code[index + 1]]?.icon
                }))
            };


            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
            this.displayWeather(mockWeatherData, city);
        } catch (error) {
            this.showError("Failed to fetch weather data. Please try again.");
        }
        this.hideLoading();
    }

    validateCity(city) {
        if (!/^[a-zA-Z\s]+$/.test(city)) {
            this.showError("Please enter a valid city name (letters only)");
            return false;
        }
        return true;
    }



    displayWeather(data, city) {
        $('#cityName').text(city);
        $('#temperature').text(`${data.current.temp}°C`);
        $('#conditions').text(weatherIcons[data.current.conditions].description);
        // Update weather icon
        const iconClass = weatherIcons[data.current.conditions].icon || 'fa-question';
        $('#weatherIcon').html(`<i class= "fas ${iconClass}"></i> `);

        $('#currentWeather').fadeIn();
        this.displayForecast(data.forecast);
        this.hideError();
    }

    displayForecast(forecast) {
        const forecastHtml = forecast.map(day => {
            const iconClass = weatherIcons[day.conditions].icon || 'fa-question';
            const condition = weatherIcons[day.conditions].description
            return `<div class= "forecast-day" >
                            <div class="date">${day.date}</div>
                            <div class="weather-icon">
                                <i class="fas ${iconClass}"></i>
                            </div>
                            <div class="temp">${day.temp}°C</div>
                            <div class="conditions">${condition}</div>
                        </div >
                        `;
        }).join('');

        $('#forecast').html(forecastHtml);
    }



    toggleFavorite() {
        const city = $('#cityInput').val().trim();
        if (!city) return;

        if (this.favorites.includes(city)) {
            this.favorites = this.favorites.filter(f => f !== city);
        } else {
            this.favorites.push(city);
        }

        this.saveFavorites();
        this.loadFavorites();
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }

    loadFavorites() {
        const favoritesHtml = this.favorites.map(city => `
                        <div class="favorite-item" onclick = "dashboard.searchCity('${city}')" >
                            ${city}
                    </div >
                `).join('');

        $('#favoritesList').html(favoritesHtml);
    }


    loadThemes() {
        if (localStorage.getItem('dashboardSettings') !== null) {
            this.dashboardSettings = JSON.parse(localStorage.getItem('dashboardSettings') || '{}');
            console.log(this.dashboardSettings)
            $('#primaryBg').val(this.dashboardSettings?.primaryBg)
            $('#secondaryBg').val(this.dashboardSettings?.secondaryBg)
            $('#accent').val(this.dashboardSettings?.accent)

            $('button:hover').attr("style", `background:${this.dashboardSettings?.accent}`)
            $('body').attr("style", `background:linear-gradient(135deg, ${this.dashboardSettings?.primaryBg}, ${this.dashboardSettings.secondaryBg});`)
        }
    }

    searchCity(city) {
        $('#cityInput').val(city);
        this.searchWeather();
    }

    saveSettings() {
        const settings = {
            primaryBg: $('#primaryBg').val(),
            secondaryBg: $('#secondaryBg').val(),
            accent: $('#accent').val()
        };
        $('body').attr("style", `background:linear-gradient(135deg, ${settings.primaryBg}, ${settings.secondaryBg});`)
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
        $('#settingsDialog').dialog('close');
    }

    showLoading() {
        $('#loading').show();
    }

    hideLoading() {
        $('#loading').hide();
    }

    showError(message) {
        $('#error').text(message).fadeIn();
    }

    hideError() {
        $('#error').fadeOut();
    }

}

const dashboard = new WeatherDashboard();

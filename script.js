// Register the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Define your API keys
const openWeatherApiKey = '53ad03288e2c21bbf2aea3ae3f1344de'; // Replace with your OpenWeather API key
const unsplashApiKey = 'ggoz2N2Aa4g8Vj7BLyEEsMj78B5yfsL0IzVz2WDhxes'; // Replace with your Unsplash API key

// Ensure the DOM is fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');
    console.log('OpenWeather API Key:', openWeatherApiKey); // Log API key for debugging
    console.log('Unsplash API Key:', unsplashApiKey); // Log API key for debugging
    // Optionally adjust the weather-dashboard height
    const dashboard = document.querySelector('.weather-dashboard');
    if (dashboard) {
        dashboard.style.minHeight = 'auto';
    } else {
        console.error('Dashboard element not found');
    }

    const getWeatherButton = document.getElementById('getWeather');
    const getCurrentLocationWeatherButton = document.getElementById('getCurrentLocationWeather');
    const refreshWeatherButton = document.getElementById('refreshWeather');

    // Automatically fetch current location weather on load
    console.log('Initializing application...');
    getCurrentLocationWeather();

    if (getWeatherButton) {
        getWeatherButton.addEventListener('click', fetchWeather);
    } else {
        console.error('Get Weather button not found');
    }

    if (getCurrentLocationWeatherButton) {
        getCurrentLocationWeatherButton.addEventListener('click', getCurrentLocationWeather);
    } else {
        console.error('Get Current Location Weather button not found');
    }

    if (refreshWeatherButton) {
        refreshWeatherButton.addEventListener('click', () => {
            // Implement refresh functionality
            location.reload();
        });
    } else {
        console.error('Refresh Weather button not found');
    }

    initSmoothScroll();
    initForecastSlider();
    initForecastNavigation();
});

// Function to fetch weather for a user-entered city
function fetchWeather() {
    const cityInput = document.getElementById('city');
    if (!cityInput) {
        console.error('City input element not found');
        showError('City input is missing.');
        return;
    }
    const city = cityInput.value.trim();
    if (city) {
        console.log(`Fetching weather for city: ${city}`);
        getWeatherByCity(city);
    } else {
        showError('Please enter a city name.');
    }
}

// Function to fetch weather based on current location
function getCurrentLocationWeather() {
    console.log('getCurrentLocationWeather called');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                console.log('Geolocation successful:', position.coords);
                const { latitude, longitude } = position.coords;
                getWeatherByCoordinates(latitude, longitude);
            },
            error => {
                console.error('Geolocation error:', error);
                showError('Unable to retrieve location. Please enter a city manually.');
            }
        );
    } else {
        console.error('Geolocation not supported');
        showError('Geolocation is not supported by this browser.');
    }
}

// Function to fetch weather by city name
function getWeatherByCity(city) {
    showLoading(true);
    hideWeatherDetails();

    fetchWeatherData(city)
        .then(data => {
            console.log('Weather data:', data); // Debug log
            displayCurrentWeather(data);
            return fetchForecast(city);
        })
        .then(forecastData => {
            console.log('Forecast data:', forecastData); // Debug log
            displayForecast(forecastData);
        })
        .catch(error => {
            console.error('Error in getWeatherByCity:', error);
            showError(error.message || 'An error occurred. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

// Function to fetch weather data by city name
function fetchWeatherData(city) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${openWeatherApiKey}&units=metric`;
    console.log('Fetching weather data from:', weatherUrl); // Debug log

    return fetch(weatherUrl)
        .then(response => {
            console.log('Weather data response:', response);
            if (!response.ok) {
                // Handle HTTP errors
                throw new Error(`Weather API error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Weather data received:', data);
            if (data.cod !== 200) {
                // Handle API errors
                throw new Error(`API Error: ${data.message}`);
            }
            return data;
        })
        .catch(error => {
            console.error('Error in fetchWeatherData:', error);
            showError(error.message || 'An error occurred while fetching weather data.');
            throw error;
        });
}

// Function to fetch 5-day forecast by city name
function fetchForecast(city) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${openWeatherApiKey}&units=metric`;
    console.log('Fetching forecast data from:', forecastUrl); // Debug log

    return fetch(forecastUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.cod !== "200") {
                throw new Error(`API error! Message: ${data.message}`);
            }
            return data;
        })
        .catch(error => {
            console.error('Error fetching forecast data:', error);
            throw error;
        });
}

// Function to fetch weather by coordinates - update this function
function getWeatherByCoordinates(lat, lon) {
    console.log(`Fetching weather for coordinates: ${lat}, ${lon}`);
    showLoading(true);
    hideWeatherDetails();

    // Fetch both weather and air quality data
    Promise.all([
        fetchWeatherDataByCoordinates(lat, lon),
        fetchAirQuality(lat, lon),
        fetchForecastByCoordinates(lat, lon)
    ])
        .then(([weatherData, aqiData, forecastData]) => {
            console.log('Weather data by coordinates:', weatherData); // Debug log
            console.log('Air quality data:', aqiData); // Debug log
            console.log('Forecast data by coordinates:', forecastData); // Debug log
            displayCurrentWeather(weatherData);
            displayAirQuality(aqiData);
            displayForecast(forecastData);
            displayHourlyForecast(forecastData);
            return forecastData;
        })
        .catch(error => {
            console.error('Error in getWeatherByCoordinates:', error);
            showError(error.message || 'An error occurred.');
        })
        .finally(() => {
            showLoading(false);
        });
}

// Function to fetch weather data by coordinates
function fetchWeatherDataByCoordinates(lat, lon) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric`;
    console.log('Fetching weather data by coordinates from:', weatherUrl); // Debug log

    return fetch(weatherUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.cod !== 200) {
                throw new Error(`API error! Message: ${data.message}`);
            }
            return data;
        })
        .catch(error => {
            console.error('Error fetching weather data by coordinates:', error);
            throw error;
        });
}

// Function to fetch 5-day forecast by coordinates
function fetchForecastByCoordinates(lat, lon) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric`;
    console.log('Fetching forecast data by coordinates from:', forecastUrl); // Debug log

    return fetch(forecastUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.cod !== "200") {
                throw new Error(`API error! Message: ${data.message}`);
            }
            return data;
        })
        .catch(error => {
            console.error('Error fetching forecast data by coordinates:', error);
            throw error;
        });
}

// Add new function to fetch Air Quality data
function fetchAirQuality(lat, lon) {
    const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}`;
    console.log('Fetching air quality data from:', aqiUrl); // Debug log

    return fetch(aqiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching air quality data:', error);
            throw error;
        });
}

// Update displayAirQuality function to be more detailed
function displayAirQuality(data) {
    const airQuality = document.getElementById('airQuality'); // Changed from 'aqiDetails' to 'airQuality'
    const aqi = data.list[0].main.aqi;
    const components = data.list[0].components;

    const aqiLevels = {
        1: { level: 'Good', color: '#4caf50' },
        2: { level: 'Fair', color: '#ffeb3b' },
        3: { level: 'Moderate', color: '#ff9800' },
        4: { level: 'Poor', color: '#f44336' },
        5: { level: 'Very Poor', color: '#880e4f' }
    };

    const { level, color } = aqiLevels[aqi];

    airQuality.innerHTML = `
        <div class="aqi-level" style="border-left: 4px solid ${color}">
            <div class="aqi-main">
                <h5>AQI: <span style="color: ${color}">${level}</span></h5>
                <div class="aqi-score" style="color: ${color}">${aqi}/5</div>
            </div>
            <div class="aqi-details">
                <div class="component">
                    <span class="label">PM2.5</span>
                    <span class="value">${components.pm2_5}</span>
                </div>
                <div class="component">
                    <span class="label">PM10</span>
                    <span class="value">${components.pm10}</span>
                </div>
                <div class="component">
                    <span class="label">NO₂</span>
                    <span class="value">${components.no2}</span>
                </div>
                <div class="component">
                    <span class="label">O₃</span>
                    <span class="value">${components.o3}</span>
                </div>
            </div>
        </div>
    `;
}

// Update displayCurrentWeather function to include wind details
function displayCurrentWeather(data) {
    // Add fade out effect before updating
    const weatherResult = document.getElementById('weatherResult');
    weatherResult.style.opacity = '0';

    setTimeout(() => {
        // Show both weather result and forecast sections
        document.getElementById('weatherResult').classList.remove('d-none');
        document.getElementById('forecast').classList.remove('d-none');

        // Clear any previous errors
        document.getElementById('error').classList.add('d-none');

        // Display the location name
        document.getElementById('locationName').textContent = `${data.name}, ${data.sys.country}`;

        // Update weather details
        document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('description').textContent = data.weather[0].description;
        document.getElementById('humidity').textContent = `Humidity: ${data.main.humidity}%`;
        document.getElementById('pressure').textContent = `Pressure: ${data.main.pressure} hPa`;
        document.getElementById('windSpeed').textContent = `Wind Speed: ${data.wind.speed} m/s`;
        document.getElementById('windPressure').textContent = `Wind Direction: ${data.wind.deg}°`;

        // Update weather icon
        const iconCode = data.weather[0].icon;
        document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        document.getElementById('dateTime').textContent = `Last updated: ${new Date().toLocaleString()}`;

        // Update background and highlights
        updateBackground(data.weather[0].main.toLowerCase());
        updateWeatherHighlights(data);

        // Update Wind Details card
        document.getElementById('windGust').innerHTML = `
            <div class="stat-label">Wind Gust</div>
            <div class="stat-value">${data.wind?.gust || 'N/A'} m/s</div>
        `;
        document.getElementById('windDirection').innerHTML = `
            <div class="stat-label">Direction</div>
            <div class="stat-value">${getWindDirection(data.wind.deg)}</div>
        `;
        document.getElementById('windPressure').innerHTML = `
            <div class="stat-label">Pressure</div>
            <div class="stat-value">${data.main.pressure} hPa</div>
        `;

        // Update Precipitation card
        document.getElementById('rainChance').innerHTML = `
            <div class="stat-label">Rain Chance</div>
            <div class="stat-value">${data.rain ? `${data.rain['1h']} mm` : '0 mm'}</div>
        `;
        document.getElementById('humidity').innerHTML = `
            <div class="stat-label">Humidity</div>
            <div class="stat-value">${data.main.humidity}%</div>
        `;
        document.getElementById('dewPoint').innerHTML = `
            <div class="stat-label">Feels Like</div>
            <div class="stat-value">${Math.round(data.main.feels_like)}°C</div>
        `;

        // Update Sun Position
        updateSunPosition(data.sys.sunrise, data.sys.sunset);
        updateSunTimes(data.sys.sunrise, data.sys.sunset);

        document.getElementById('visibility').innerHTML = `
            <div class="stat-label">Visibility</div>
            <div class="stat-value">${data.visibility / 1000} km</div>
        `;

        // Update Moon Phase
        const moonPhase = calculateMoonPhase(new Date());
        document.getElementById('moonPhase').innerHTML = `
            <div class="moon-phase-icon">${getMoonPhaseEmoji(moonPhase)}</div>
            <div class="moon-phase-text">${getMoonPhaseName(moonPhase)}</div>
        `;

        // Fade in the updated content
        weatherResult.style.transition = 'opacity 0.5s ease';
        weatherResult.style.opacity = '1';
    }, 300);
}

// Add new function to get wind direction
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Add new function to update sun position
function updateSunPosition(sunrise, sunset) {
    const now = new Date().getTime() / 1000;
    const sunriseTime = new Date(sunrise * 1000);
    const sunsetTime = new Date(sunset * 1000);
    const dayLength = sunset - sunrise;
    const progress = ((now - sunrise) / dayLength) * 100;

    document.getElementById('sunPath').innerHTML = `
        <div class="sun-path">
            <div class="sun-progress" style="width: ${Math.min(Math.max(progress, 0), 100)}%">
                <span class="sun-icon">🌞</span>
            </div>
            <div class="sun-times">
                <span>🌅 ${sunriseTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                <span>🌇 ${sunsetTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    `;
}

// Add new function to update sun times
function updateSunTimes(sunrise, sunset) {
    const sunriseTime = new Date(sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = new Date(sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('sunTimes').innerHTML = `
        <div class="sun-time">
            <i class="fas fa-sunrise"></i> Sunrise: ${sunriseTime}
        </div>
        <div class="sun-time">
            <i class="fas fa-sunset"></i> Sunset: ${sunsetTime}
        </div>
    `;
}

// Optional: Limit the number of forecast items rendered on smaller screens
function displayForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = ''; // Clear existing items

    const isMobile = window.innerWidth <= 768;
    const itemsToShow = isMobile ? 5 : 5; // Always show 5 days

    for (let i = 0; i < itemsToShow; i++) {
        const item = data.list[i * 8]; // Assuming data.list has 3-hour intervals
        const forecastItem = createForecastItem(item, i);
        forecastContainer.appendChild(forecastItem);
    }

    forecastContainer.style.opacity = '1';
}

// Add new function for creating forecast items with animation
function createForecastItem(item, index) {
    const date = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const temp = Math.round(item.main.temp);
    const description = item.weather[0].description;
    const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;

    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.innerHTML = `
        <h5>${dayName}</h5>
        <img src="${iconUrl}" alt="Weather Icon">
        <div class="temp">${temp}°C</div>
        <div class="description">${description.charAt(0).toUpperCase() + description.slice(1)}</div>
    `;
    return forecastItem;
}

// Optional: Implement scroll buttons for forecast navigation
document.getElementById('forecastScrollLeft').addEventListener('click', () => {
    const container = document.getElementById('forecastContainer');
    container.scrollBy({ left: -200, behavior: 'smooth' });
});

document.getElementById('forecastScrollRight').addEventListener('click', () => {
    const container = document.getElementById('forecastContainer');
    container.scrollBy({ left: 200, behavior: 'smooth' });
});

// Update the initForecastSlider function
function initForecastSlider() {
    const container = document.getElementById('forecastContainer');
    const scrollLeft = document.querySelector('.scroll-left');
    const scrollRight = document.querySelector('.scroll-right');

    if (scrollLeft && scrollRight && container) {
        const scrollAmount = container.offsetWidth / 2;

        scrollLeft.addEventListener('click', () => {
            container.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        scrollRight.addEventListener('click', () => {
            container.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        // Show/hide arrows based on scroll position
        container.addEventListener('scroll', () => {
            scrollLeft.style.display = container.scrollLeft <= 0 ? 'none' : 'flex';
            scrollRight.style.display =
                container.scrollLeft >= container.scrollWidth - container.offsetWidth
                    ? 'none'
                    : 'flex';
        });

        // Initial check for arrows
        setTimeout(() => {
            scrollLeft.style.display = container.scrollLeft <= 0 ? 'none' : 'flex';
            scrollRight.style.display =
                container.scrollWidth > container.offsetWidth
                    ? 'flex'
                    : 'none';
        }, 100);
    }
}

// Add new function to update weather highlights
function updateWeatherHighlights(data) {
    // Since we don't have UV data in the current API response, we'll mark it as N/A
    document.getElementById('uvIndex').innerHTML = `
        <div class="uv-value">N/A</div>
        <div class="uv-level">Not available</div>
    `;

    // Update Moon Phase
    const moonPhase = calculateMoonPhase(new Date());
    document.getElementById('moonPhase').innerHTML = `
        <div class="moon-phase-container">
            <div class="moon-phase-icon">${getMoonPhaseEmoji(moonPhase)}</div>
            <div class="moon-phase-text">${getMoonPhaseName(moonPhase)}</div>
        </div>
    `;

    // Update Sunrise & Sunset
    if (data.sys) {
        const sunrise = data.sys.sunrise;
        const sunset = data.sys.sunset;

        document.getElementById('sunriseSunset').innerHTML = `
            <div class="sun-times">
                <div class="sun-time">
                    <i class="fas fa-sun"></i> Sunrise: ${formatTime(sunrise)}
                </div>
                <div class="sun-time">
                    <i class="fas fa-moon"></i> Sunset: ${formatTime(sunset)}
                </div>
            </div>
        `;
    }

    // Fetch UV Index and update UI
    fetchUVIndex(data.coord.lat, data.coord.lon)
        .then(uviData => {
            const uvi = uviData.value;
            const uvLevel = getUVIndexLevel(uvi);

            document.getElementById('uvIndex').innerHTML = `
                <div class="uv-value">${uvi.toFixed(1)}</div>
                <div class="uv-level">${uvLevel}</div>
            `;
        })
        .catch(error => {
            console.error('Error fetching UV index:', error);
            document.getElementById('uvIndex').innerHTML = `
                <div class="uv-value">N/A</div>
                <div class="uv-level">UV Index not available</div>
            `;
        });
}

// Utility function to format Unix timestamp to readable time
function formatTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Utility function to get UV Index level
function getUVIndexLevel(uvi) {
    if (uvi <= 2) return 'Low';
    if (uvi <= 5) return 'Moderate';
    if (uvi <= 7) return 'High';
    if (uvi <= 10) return 'Very High';
    return 'Extreme';
}

// Add a function to fetch the UV Index
function fetchUVIndex(lat, lon) {
    const uviUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}`;
    return fetch(uviUrl).then(response => response.json());
}

// Utility function to update the background based on weather condition
async function updateBackground(weatherCondition) {
    const searchTerm = getSearchTermForWeatherCondition(weatherCondition);
    const imageUrl = await fetchUnsplashImage(searchTerm);

    const body = document.querySelector('body');
    body.style.backgroundImage = `url(${imageUrl})`;
}

// Function to get the search term for Unsplash based on weather condition
function getSearchTermForWeatherCondition(weatherCondition) {
    const searchTerms = {
        clear: 'clear sky',
        clouds: 'cloudy',
        rain: 'rain',
        snow: 'snow',
        thunderstorm: 'thunderstorm',
        haze: 'haze',
    };
    return searchTerms[weatherCondition] || 'nature';
}

// Function to fetch an image from Unsplash based on a search term
async function fetchUnsplashImage(searchTerm) {
    const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchTerm)}&client_id=${unsplashApiKey}`;

    const response = await fetch(unsplashUrl);

    if (!response.ok) {
        throw new Error('Could not fetch image from Unsplash');
    }

    const data = await response.json();
    return data.urls?.regular || 'default_image_url.jpg'; // Fallback to a default image if not found
}

// Add utility functions for moon phase calculations
function calculateMoonPhase(date) {
    // Simple moon phase calculation (0-1)
    const yearPhase = ((date.getFullYear() - 2000) % 19) / 19;
    const monthPhase = (date.getMonth() / 12);
    const dayPhase = (date.getDate() / 30);
    return ((yearPhase + monthPhase + dayPhase) % 1);
}

function getMoonPhaseName(phase) {
    if (phase < 0.125) return 'New Moon';
    if (phase < 0.25) return 'Waxing Crescent';
    if (phase < 0.375) return 'First Quarter';
    if (phase < 0.5) return 'Waxing Gibbous';
    if (phase < 0.625) return 'Full Moon';
    if (phase < 0.75) return 'Waning Gibbous';
    if (phase < 0.875) return 'Last Quarter';
    return 'Waning Crescent';
}

function getMoonPhaseEmoji(phase) {
    const moonEmojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
    const index = Math.floor(phase * 8) % 8;
    return moonEmojis[index];
}

// Utility function to show loading indicator
function showLoading(isLoading) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        if (isLoading) {
            loadingDiv.classList.remove('d-none');
        } else {
            loadingDiv.classList.add('d-none');
        }
    } else {
        console.error('Loading element not found');
    }
}

// Utility function to show error message
function showError(message) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    } else {
        console.error('Error element not found:', message);
    }
}

// Utility function to hide weather details initially
function hideWeatherDetails() {
    const errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.classList.add('d-none');
        errorElement.textContent = '';
    } else {
        console.error('Error element not found');
    }

    const weatherResult = document.getElementById('weatherResult');
    if (weatherResult) {
        weatherResult.classList.add('d-none');
    } else {
        console.error('Weather result element not found');
    }

    const forecast = document.getElementById('forecast');
    if (forecast) {
        forecast.classList.add('d-none');
    } else {
        console.error('Forecast element not found');
    }
}

// Add new function to display hourly forecast
function displayHourlyForecast(data) {
    const hourlyContainer = document.getElementById('hourlyForecast');
    hourlyContainer.style.opacity = '0';

    setTimeout(() => {
        hourlyContainer.innerHTML = '';
        data.list.slice(0, 24).forEach((item, index) => {
            const hourlyItem = createHourlyItem(item);
            hourlyItem.style.animationDelay = `${index * 0.05}s`;
            hourlyContainer.appendChild(hourlyItem);
        });

        hourlyContainer.style.transition = 'opacity 0.5s ease';
        hourlyContainer.style.opacity = '1';
    }, 300);
}

// Add new function for creating hourly items with animation
function createHourlyItem(item) {
    const hourlyItem = document.createElement('div');
    hourlyItem.className = 'hourly-item glass-effect animate__animated animate__fadeInRight';
    hourlyItem.innerHTML = `
        <div class="hour">${new Date(item.dt * 1000).getHours()}:00</div>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="weather icon">
        <div class="temp">${Math.round(item.main.temp)}°C</div>
    `;
    return hourlyItem;
}

// Add smooth scroll behavior for containers
function initSmoothScroll() {
    document.querySelectorAll('.scroll-container').forEach(container => {
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.style.cursor = 'grabbing';
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            container.style.transition = 'none';
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.style.cursor = 'grab';
            container.style.transition = 'all 0.3s ease';
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            container.style.cursor = 'grab';
            container.style.transition = 'all 0.3s ease';
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
    });
}

// Add function for forecast navigation
function initForecastNavigation() {
    const scrollLeft = document.getElementById('forecastScrollLeft');
    const scrollRight = document.getElementById('forecastScrollRight');
    const container = document.getElementById('forecastContainer');

    if (scrollLeft && scrollRight && container) {
        scrollLeft.addEventListener('click', () => {
            container.scrollBy({ left: -150, behavior: 'smooth' });
        });

        scrollRight.addEventListener('click', () => {
            container.scrollBy({ left: 150, behavior: 'smooth' });
        });
    }
}
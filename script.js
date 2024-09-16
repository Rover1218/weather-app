// Define your API key
const apiKey = '53ad03288e2c21bbf2aea3ae3f1344de'; // Replace with your OpenWeather API key

// Ensure the DOM is fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function () {
    const getWeatherButton = document.getElementById('getWeather');
    const getCurrentLocationWeatherButton = document.getElementById('getCurrentLocationWeather');
    const refreshWeatherButton = document.getElementById('refreshWeather');
    
    if (getWeatherButton) {
        getWeatherButton.addEventListener('click', fetchWeather);
    }

    if (getCurrentLocationWeatherButton) {
        getCurrentLocationWeatherButton.addEventListener('click', getCurrentLocationWeather);
    }

    if (refreshWeatherButton) {
        refreshWeatherButton.addEventListener('click', fetchWeather);
    }
});

// Function to fetch weather for a user-entered city
function fetchWeather() {
    const city = document.getElementById('city').value.trim();

    if (city) {
        getWeatherByCity(city);
    } else {
        alert('Please enter a city name.');
    }
}

// Function to fetch weather based on current location
function getCurrentLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            getWeatherByCoordinates(latitude, longitude);
        }, () => {
            showError('Unable to retrieve location. Please enter a city manually.');
        });
    } else {
        showError('Geolocation is not supported by this browser.');
    }
}

// Function to fetch weather by city name
function getWeatherByCity(city) {
    showLoading(true);
    hideWeatherDetails();
    
    fetchWeatherData(city)
        .then(data => {
            if (data.cod === 200) {
                displayCurrentWeather(data);
                return fetchForecast(city);
            } else {
                throw new Error('City not found. Please try again.');
            }
        })
        .then(forecastData => {
            displayForecast(forecastData);
        })
        .catch(error => {
            showError(error.message || 'An error occurred. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

// Function to fetch weather by coordinates (for current location)
function getWeatherByCoordinates(lat, lon) {
    showLoading(true);
    hideWeatherDetails();

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    fetch(weatherUrl)
        .then(response => response.json())
        .then(data => {
            if (data.cod === 200) {
                displayCurrentWeather(data);
                return fetchForecastByCoordinates(lat, lon);
            } else {
                throw new Error('Location weather not found. Please try again.');
            }
        })
        .then(forecastData => {
            displayForecast(forecastData);
        })
        .catch(error => {
            showError(error.message || 'An error occurred. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

// Function to fetch current weather data by city name
function fetchWeatherData(city) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    return fetch(weatherUrl).then(response => response.json());
}

// Function to fetch 5-day forecast by city name
function fetchForecast(city) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    return fetch(forecastUrl).then(response => response.json());
}

// Function to fetch 5-day forecast by coordinates
function fetchForecastByCoordinates(lat, lon) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    return fetch(forecastUrl).then(response => response.json());
}

// Function to display current weather data
function displayCurrentWeather(data) {
    document.getElementById('weatherResult').classList.remove('d-none');
    
    document.getElementById('temperature').textContent = `Temperature: ${data.main.temp}°C`;
    document.getElementById('description').textContent = `Description: ${data.weather[0].description}`;
    document.getElementById('humidity').textContent = `Humidity: ${data.main.humidity}%`;
    document.getElementById('pressure').textContent = `Pressure: ${data.main.pressure} hPa`;
    document.getElementById('windSpeed').textContent = `Wind Speed: ${data.wind.speed} m/s`;
    document.getElementById('windPressure').textContent = `Wind Pressure: ${data.wind.deg}°`;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
    document.getElementById('dateTime').textContent = `Last updated: ${new Date().toLocaleString()}`;

    updateBackground(data.weather[0].main.toLowerCase());
}

// Function to display 5-day forecast with "Today", "Tomorrow", etc.
function displayForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = ''; // Clear existing forecast

    const dayNames = ['Today', 'Tomorrow']; // Dynamic day names
    let currentDate = new Date();

    data.list.forEach((item, index) => {
        if (index % 8 === 0) { // Display forecast for every 24 hours
            const forecastItem = document.createElement('div');
            forecastItem.className = 'col-md-2 text-center mb-4';

            // Set the day name
            let dayName;
            if (dayNames.length < 6) {
                dayName = dayNames.length < 3 ? dayNames[dayNames.length - 1] : currentDate.toLocaleDateString(undefined, { weekday: 'long' });
                dayNames.push(dayName);
            } else {
                dayName = currentDate.toLocaleDateString(undefined, { weekday: 'long' });
            }

            forecastItem.innerHTML = `
                <h5>${dayName}</h5>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather icon" style="max-width: 80px;">
                <p>${Math.round(item.main.temp)}°C</p>
                <p>${item.weather[0].description}</p>
            `;

            forecastContainer.appendChild(forecastItem);
            currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        }
    });

    document.getElementById('forecast').classList.remove('d-none');
}

// Utility function to update the background based on weather condition
function updateBackground(weatherCondition) {
    const backgrounds = {
        clear: 'url(./images/clear.jpg)', // Use your image paths here
        clouds: 'url(./images/clouds.jpg)',
        rain: 'url(./images/rain.jpg)',
        snow: 'url(./images/snow.jpg)',
        thunderstorm: 'url(./images/thunderstorm.jpg)',
        default: 'url(./images/default.jpg)'
    };

    const body = document.querySelector('body');
    body.style.backgroundImage = backgrounds[weatherCondition] || backgrounds['default'];
}

// Utility function to show loading indicator
function showLoading(isLoading) {
    const loading = document.getElementById('loading');
    if (isLoading) {
        loading.classList.remove('d-none');
    } else {
        loading.classList.add('d-none');
    }
}

// Utility function to show error message
function showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}

// Utility function to hide weather details initially
function hideWeatherDetails() {
    document.getElementById('weatherResult').classList.add('d-none');
    document.getElementById('forecast').classList.add('d-none');
}
const carsEl = document.getElementById("cars");
const favoriteContainer = document.getElementById("fav-cars");
const carPopup = document.getElementById("car-popup");
const carInfoEl = document.getElementById("car-info");
const popupCloseBtn = document.getElementById("close-popup");

const searchTerm = document.getElementById("search-term");
const searchBtn = document.getElementById("search");
const historyBtn = document.getElementById("history"); // Use the existing button

// Your actual API keys
const CAR_API_KEY = 'VRBTeSzQJDx7hT3lE5Qg4Q==uIeOY2azXzblJiUY';
const UNSPLASH_API_KEY = '3HOBoao-E2S3mrTrbm5-4zsASdb4rAxJAcsX-aFQ_08';

// Fetch car models based on a search term (make or model)
async function getCarsBySearch(term) {
    const url = `https://api.api-ninjas.com/v1/cars?model=${encodeURIComponent(term)}&limit=10`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'X-Api-Key': CAR_API_KEY },
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching car models:', error);
        return null;
    }
}

// Fetch car image from Unsplash
async function getCarImage(make, model) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(make + ' ' + model)}&client_id=${UNSPLASH_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.results[0]?.urls.small || 'https://via.placeholder.com/250';
    } catch (error) {
        console.error('Error fetching car image:', error);
        return 'https://via.placeholder.com/250';
    }
}

// Add car to the UI
async function addCar(carData) {
    const car = document.createElement("div");
    car.classList.add("car");

    const imageUrl = await getCarImage(carData.make, carData.model);

    car.innerHTML = `
        <div class="car-header">
            <img src="${imageUrl}" alt="${carData.make} ${carData.model}" />
        </div>
        <div class="car-body">
            <h4>${carData.make} ${carData.model} (${carData.year})</h4>
            <button class="fav-btn">
                <i class="fas fa-heart"></i>
            </button>
        </div>
    `;

    const btn = car.querySelector(".car-body .fav-btn");

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.classList.contains("active")) {
            removeCarLS(carData.id);
            btn.classList.remove("active");
        } else {
            addCarLS(carData);
            btn.classList.add("active");
        }

        fetchFavCars();
    });

    car.addEventListener("click", () => {
        showCarInfo(carData, imageUrl);
    });

    carsEl.appendChild(car);
}

// Show car details in a popup
function showCarInfo(carData, imageUrl) {
    carInfoEl.innerHTML = `
        <h1>${carData.make} ${carData.model} (${carData.year})</h1>
        <img src="${imageUrl}" alt="${carData.make} ${carData.model}" />
        <h3>Class: ${carData.class || 'N/A'}</h3>
        <p>Fuel Type: ${carData.fuel_type || 'N/A'}</p>
        <p>Drive: ${carData.drive || 'N/A'}</p>
        <p>Cylinders: ${carData.cylinders || 'N/A'}</p>
        <p>Transmission: ${carData.transmission || 'N/A'}</p>
    `;

    carPopup.classList.remove("hidden");
}

// Search for cars when the search button is clicked
searchBtn.addEventListener("click", searchCars);

// Search for cars
async function searchCars() {
    carsEl.innerHTML = ""; // Clear current cars

    const search = searchTerm.value;
    if (!search) return;

    const cars = await getCarsBySearch(search);

    if (cars && cars.length > 0) {
        for (const car of cars) {
            await addCar(car);
        }
        addToSearchHistory(search);
    } else {
        carsEl.innerHTML = "<p>No cars found for your search.</p>";
    }
}

// Close popup
popupCloseBtn.addEventListener("click", () => {
    carPopup.classList.add("hidden");
});

// Save and retrieve favorite cars in local storage
function getCarsLS() {
    const cars = JSON.parse(localStorage.getItem("favoriteCars"));
    return cars === null ? [] : cars;
}

function addCarLS(carData) {
    const cars = getCarsLS();
    localStorage.setItem("favoriteCars", JSON.stringify([...cars, carData]));
}

function removeCarLS(carId) {
    const cars = getCarsLS();
    localStorage.setItem(
        "favoriteCars",
        JSON.stringify(cars.filter((car) => car.id !== carId))
    );
}

// Fetch favorite cars from local storage and display them
async function fetchFavCars() {
    const cars = getCarsLS();

    favoriteContainer.innerHTML = "";

    for (const carData of cars) {
        const favCarEl = document.createElement("li");
        const imageUrl = await getCarImage(carData.make, carData.model);

        favCarEl.innerHTML = `
            <img src="${imageUrl}" alt="${carData.make} ${carData.model}" />
            <span>${carData.make} ${carData.model}</span>
            <button class="clear"><i class="fas fa-times"></i></button>
        `;

        const btn = favCarEl.querySelector(".clear");

        btn.addEventListener("click", () => {
            removeCarLS(carData.id);
            fetchFavCars();
        });

        favoriteContainer.appendChild(favCarEl);
    }
}

// Search history functionality
function addToSearchHistory(term) {
    let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    if (!history.includes(term)) {
        history.unshift(term);
        history = history.slice(0, 5); // Keep only the last 5 searches
        localStorage.setItem("searchHistory", JSON.stringify(history));
    }
}

function showSearchHistory() {
    const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    const historyEl = document.createElement("div");
    historyEl.classList.add("search-history");
    historyEl.innerHTML = "<h3>Search History</h3>";

    history.forEach(term => {
        const termEl = document.createElement("div");
        termEl.textContent = term;
        termEl.addEventListener("click", () => {
            searchTerm.value = term;
            searchCars();
        });
        historyEl.appendChild(termEl);
    });

    const clearHistoryBtn = document.createElement("button");
    clearHistoryBtn.textContent = "Clear History";
    clearHistoryBtn.addEventListener("click", () => {
        localStorage.removeItem("searchHistory");
        historyEl.innerHTML = "<p>History cleared!</p>";
    });

    historyEl.appendChild(clearHistoryBtn);
    document.body.appendChild(historyEl);
}

historyBtn.addEventListener("click", showSearchHistory);

// Initial load
fetchFavCars();
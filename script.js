// Define the path to your CSV file. This path is now relative to the HTML file.
const csvFilePath = 'netflix_movies.csv';
// The ID of the HTML element where the movie list will be displayed.
const movieListContainer = document.getElementById('movie-list');
// Select the search input and the sort buttons
const searchInput = document.getElementById('searchInput');
const sortTitleAscBtn = document.getElementById('sortTitleAsc');
const sortTitleDescBtn = document.getElementById('sortTitleDesc');
const sortScoreDescBtn = document.getElementById('sortScoreDesc');
const sortScoreAscBtn = document.getElementById('sortScoreAsc');
// Select the new spinwheel button
const spinWheelBtn = document.getElementById('spinWheelBtn');

// Global variable to hold the original, complete movie dataset.
let allMovies = [];

// Function to handle errors and display a user-friendly message.
function displayError(message) {
    // FIX: Changed quotes to backticks for the template literal
    movieListContainer.innerHTML = `<p class="error-message">${message}</p>`;
    console.error(message);
}

// Function to parse the CSV text and convert it into a JavaScript array of objects.
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) {
        return [];
    }

    // The first line is the header, which we can use for our object keys.
    const headers = lines[0].split(',').map(header => header.trim());

    // Process the remaining lines (the data rows).
    const data = lines.slice(1).map(line => {
        // Use a more robust split to handle commas inside quoted strings
        const values = [];
        let inQuote = false;
        let start = 0;

        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                inQuote = !inQuote;
            } else if (line[i] === ',' && !inQuote) {
                values.push(line.substring(start, i).replace(/(^"|"$)/g, '').trim());
                start = i + 1;
            }
        }
        values.push(line.substring(start).replace(/(^"|"$)/g, '').trim());

        const movie = {};
        // Ensure values array has the same length as headers
        headers.forEach((header, index) => {
            movie[header] = values[index] || '';
        });

        return movie;
    });

    return data;
}

// Function to create and append a single movie item to the webpage.
function createMovieItem(movie) {
    // Validate the imdb_score to ensure it's a number between 0 and 10.
    const imdbScore = parseFloat(movie.imdb_score);
    const formattedScore = !isNaN(imdbScore) && imdbScore >= 0 && imdbScore <= 10 ? imdbScore.toFixed(1) : '-';

    // Create the main container for a single movie.
    const movieItem = document.createElement('div');
    movieItem.classList.add('movie-item');

    // Create the title element.
    const title = document.createElement('h2');
    title.classList.add('movie-title');
    title.textContent = movie.title || 'Unknown Title';

    // Create the rating element.
    const rating = document.createElement('p');
    rating.classList.add('imdb-rating');
    // FIX: Changed quotes to backticks for the template literal
    rating.innerHTML = `IMDb Rating: <strong>${formattedScore}</strong>`;

    // Create the link button.
    const netflixLink = document.createElement('a');
    netflixLink.classList.add('netflix-link-button');
    netflixLink.textContent = 'Watch on Netflix';
    
    // CORRECTION: Add a fallback for the movie title to prevent an invalid URL.
    const searchTitle = encodeURIComponent(movie.title || '');
    // FIX: Changed quotes to backticks for the template literal
    netflixLink.href = `https://www.netflix.com/search?q=${searchTitle}`;
    netflixLink.target = '_blank';

    // Append all elements to the movie item container.
    movieItem.appendChild(title);
    movieItem.appendChild(rating);
    movieItem.appendChild(netflixLink);

    // Append the complete movie item to the main container in the HTML.
    movieListContainer.appendChild(movieItem);
}

// Function to render a list of movies to the UI.
function renderMovies(movies) {
    movieListContainer.innerHTML = '';
    if (movies.length === 0) {
        displayError("No movies found.");
        return;
    }
    movies.forEach(movie => {
        createMovieItem(movie);
    });
}

// New Search Function
function searchMovies(query) {
    if (!allMovies.length) return; // Prevent search before data is loaded

    if (!query) {
        renderMovies(allMovies);
        return;
    }

    const filteredMovies = allMovies.filter(movie => {
        const title = movie.title ? movie.title.toLowerCase() : '';
        const description = movie.description ? movie.description.toLowerCase() : '';
        const lowerCaseQuery = query.toLowerCase();

        return title.includes(lowerCaseQuery) || description.includes(lowerCaseQuery);
    });

    renderMovies(filteredMovies);
}

// New Sort Function
function sortMovies(criteria, order = 'desc') {
    if (!allMovies.length) return; // Prevent sort before data is loaded

    let sortedMovies = [...allMovies];
    
    sortedMovies.sort((a, b) => {
        let valueA, valueB;

        if (criteria === 'title') {
            valueA = (a.title || '').toLowerCase();
            valueB = (b.title || '').toLowerCase();
            return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        } else if (criteria === 'imdb_score') {
            valueA = parseFloat(a.imdb_score);
            valueB = parseFloat(b.imdb_score);
            if (isNaN(valueA)) valueA = -Infinity;
            if (isNaN(valueB)) valueB = -Infinity;
            return order === 'asc' ? valueA - valueB : valueB - valueA;
        }
        return 0;
    });

    renderMovies(sortedMovies);
}

// New Function to pick a random movie
function pickRandomMovie() {
    if (allMovies.length === 0) {
        displayError("Cannot pick a movie. No data loaded.");
        return;
    }
    
    // Choose a random index
    const randomIndex = Math.floor(Math.random() * allMovies.length);
    const randomMovie = allMovies[randomIndex];
    
    // Clear the list and display only the chosen movie
    renderMovies([randomMovie]);
}

// Main function to load the movies.
function loadMovies() {
    fetch(csvFilePath)
        .then(response => {
            if (!response.ok) {
                // FIX: Changed quotes to backticks for the template literals
                console.error(`Failed to load CSV. Status: ${response.status}. URL: ${response.url}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            allMovies = parseCSV(csvText);
            if (allMovies.length === 0) {
                displayError("No movie data found in the CSV file.");
                return;
            }
            renderMovies(allMovies);
        })
        .catch(error => {
            displayError("Could not load the movie data. Please ensure the CSV file exists and the path is correct.");
        });
}

// Add event listeners to the search input and sort buttons.
document.addEventListener('DOMContentLoaded', () => {
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            searchMovies(event.target.value);
        });
    }

    if (sortTitleAscBtn) {
        sortTitleAscBtn.addEventListener('click', () => sortMovies('title', 'asc'));
    }

    if (sortTitleDescBtn) {
        sortTitleDescBtn.addEventListener('click', () => sortMovies('title', 'desc'));
    }

    if (sortScoreDescBtn) {
        sortScoreDescBtn.addEventListener('click', () => sortMovies('imdb_score', 'desc'));
    }

    if (sortScoreAscBtn) {
        sortScoreAscBtn.addEventListener('click', () => sortMovies('imdb_score', 'asc'));
    }

    if (spinWheelBtn) {
        spinWheelBtn.addEventListener('click', pickRandomMovie);
    }
});

loadMovies();

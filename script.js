// Define the path to your CSV file. Make sure the filename is correct.
const csvFilePath = 'Netflix_movies.csv';
// The ID of the HTML element where the movie list will be displayed.
const movieListContainer = document.getElementById('movie-list');

// Function to handle errors and display a user-friendly message.
function displayError(message) {
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
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(value => value.replace(/(^"|"$)/g, '').trim());
        const movie = {};
        
        // Use the headers to create key-value pairs for each movie.
        headers.forEach((header, index) => {
            movie[header] = values[index];
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
    title.textContent = movie.title;

    // Create the rating element.
    const rating = document.createElement('p');
    rating.classList.add('imdb-rating');
    rating.innerHTML = `IMDb Rating: <strong>${formattedScore}</strong>`;

    // Create the link button.
    const netflixLink = document.createElement('a');
    netflixLink.classList.add('netflix-link-button');
    netflixLink.textContent = 'Watch on Netflix';
    // Dynamically create a search link for Netflix
    const searchTitle = encodeURIComponent(movie.title);
    netflixLink.href = `https://www.netflix.com/search?q=${searchTitle}`;
    netflixLink.target = '_blank'; // Opens in a new tab

    // Append all elements to the movie item container.
    movieItem.appendChild(title);
    movieItem.appendChild(rating);
    movieItem.appendChild(netflixLink);

    // Append the complete movie item to the main container in the HTML.
    movieListContainer.appendChild(movieItem);
}

// Main function to load the movies.
function loadMovies() {
    // Use XMLHttpRequest as a more robust way to load local files.
    const xhr = new XMLHttpRequest();
    xhr.open('GET', csvFilePath, true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            // Parse the CSV data.
            const movies = parseCSV(xhr.responseText);

            // Check if any movies were found.
            if (movies.length === 0) {
                displayError("No movie data found in the CSV file.");
                return;
            }

            // Loop through the movie data and create an HTML element for each one.
            movies.forEach(movie => {
                createMovieItem(movie);
            });
        } else {
            // Display a more specific error message if the file can't be found.
            displayError("Could not load the movie data. Please ensure the CSV file exists and the path is correct.");
        }
    };
    xhr.onerror = function() {
        displayError("A network error occurred while trying to load the CSV file.");
    };
    xhr.send();
}

// Call the main function when the script loads.
loadMovies();

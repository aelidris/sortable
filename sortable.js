let heroes = [];
let filteredHeroes = [];
let currentPage = 1;
let pageSize = 20;
let sortOrder = { column: 'name', direction: 'asc' };

// Fetch and display data
fetch('https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json')
    .then(response => response.json())
    .then(data => {
        heroes = data;
        filteredHeroes = heroes;
        sortHeroes();
        displayTable();
        updateTotalResults();
    });

// Display heroes in the table
function displayTable() {
    const tbody = document.querySelector('#tableBody');
    tbody.innerHTML = '';
    
    const start = (currentPage - 1) * pageSize;
    const end = pageSize === 'all' ? filteredHeroes.length : start + parseInt(pageSize);
    const heroesToDisplay = filteredHeroes.slice(start, end);

    heroesToDisplay.forEach(hero => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${hero.images.xs || '-'} " alt="${hero.name}"></td>
            <td>${hero.name || '-'}</td>
            <td>${hero.biography.fullName || '-'}</td>
            <td>${formatPowerstats(hero.powerstats) || '-'}</td>
            <td>${hero.appearance.race || '-'}</td>
            <td>${hero.appearance.gender || '-'}</td>
            <td>${(hero.appearance.height[0] !== '-' ? hero.appearance.height[0] :"")+ '\n'+ hero.appearance.height[1]|| '-'}</td>
            <td>${(hero.appearance.weight[0] !== '- lb' ? hero.appearance.weight[0] :"") + '\n'+ hero.appearance.weight[1] || '-'}</td>
            <td>${hero.biography.placeOfBirth || '-'}</td>
            <td>${hero.biography.alignment || '-'}</td>
        `;
        tbody.appendChild(row);
    });

    updatePagination();
}

// Format powerstats as a string
function formatPowerstats(stats) {
    return Object.entries(stats).map(([key, value]) => `${key}: ${value}`).join(', ');
}

// Search function
document.querySelector('#searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredHeroes = heroes.filter(hero => hero.name.toLowerCase().includes(searchTerm));
    currentPage = 1;
    sortHeroes();
    displayTable();
    updateTotalResults();
});

// Pagination
document.querySelector('#pageSize').addEventListener('change', function(e) {
    pageSize = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
    currentPage = 1;
    displayTable();
});

function updatePagination() {
    const paginationDiv = document.querySelector('#pagination');
    paginationDiv.innerHTML = '';

    if (pageSize === 'all') {
        return;
    }

    const totalPages = Math.ceil(filteredHeroes.length / pageSize);

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = '←';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayTable();
        }
    });
    paginationDiv.appendChild(prevButton);

    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.disabled = i === currentPage;
        button.addEventListener('click', () => {
            currentPage = i;
            displayTable();
        });
        paginationDiv.appendChild(button);
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = '→';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayTable();
        }
    });
    paginationDiv.appendChild(nextButton);
}

// Sort table
document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
        const column = th.dataset.sort;
        toggleSort(column);
        sortHeroes();
        displayTable();
    });
});

// Properties to check for missing values
const requiredProperties = [
    'images.xs',
    'name',
    'biography.fullName',
    'powerstats',
    'appearance.race',
    'appearance.gender',
    'appearance.height',
    'appearance.weight',
    'biography.placeOfBirth',
    'biography.alignment',
];

function toggleSort(column) {
    if (sortOrder.column === column) {
        sortOrder.direction = sortOrder.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortOrder.column = column;
        sortOrder.direction = 'asc';
    }
}

function sortHeroes() {
    filteredHeroes.sort((a, b) => {
        // Check for missing required properties
        const isMissingA = hasMissingProperties(a);
        const isMissingB = hasMissingProperties(b);

        // If one is missing, put it at the end
        if (isMissingA && !isMissingB) return 1; 
        if (!isMissingA && isMissingB) return -1;
        if (isMissingA && isMissingB) return 0; 

        let valA = getNestedProperty(a, sortOrder.column);
        let valB = getNestedProperty(b, sortOrder.column);

        // Replace empty or invalid values with '-' to ensure they are placed at the end
        if (isEmpty(valA)) valA = '-';
        if (isEmpty(valB)) valB = '-';

        // Always place invalid values at the end of the sort for both valA and valB
        if (valA === '-' && valB !== '-') return 1; 
        if (valA !== '-' && valB === '-') return -1;
        if (valA === '-' && valB === '-') return 0; 

        // Handle specific sorting for weight or height if applicable
        if (sortOrder.column === 'appearance.weight') {
            valA = parseWeight(valA);
            valB = parseWeight(valB);
        }

        if (sortOrder.column === 'appearance.height') {
            valA = parseHeight(valA);
            valB = parseHeight(valB);
        }

        // Standard comparison logic
        if (valA < valB) return sortOrder.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// Check if any required properties are missing
function hasMissingProperties(hero) {
    return requiredProperties.some(property => {
        const value = getNestedProperty(hero, property);
        return isEmpty(value);
    });
}

// Update isEmpty function to check for null, undefined, empty string, and '-'
function isEmpty(value) {
    return value === null || value === undefined || value === '' || value === '-';
}

// Convert weight to kilograms (if in tons, multiply by 1000)
function parseWeight(weightStr) {
    let weight = parseFloat(weightStr) || 0;
    if (weightStr.includes('tons')) {
        weight *= 1000; 
    }
    return weight;
}

// Convert height to millimeters (if in meters, multiply by 1000)
function parseHeight(heightStr) {
    let height = parseFloat(heightStr) || 0;
    if (heightStr.includes('meters')) {
        height *= 100; 
    }
    return height;
}

function getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => {
        if (current && Array.isArray(current[key])) {
            return current[key][1];
        }
        return current && current[key] !== undefined ? current[key] : '-';
    }, obj);
}


function updateTotalResults() {
    const totalResults = document.querySelector('#totalResults');
    totalResults.textContent = `Total results: ${filteredHeroes.length}`;
}

displayTable();
updateTotalResults();
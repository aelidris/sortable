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
        displayTable();
    });

// Display heroes in the table
function displayTable() {
    const tbody = document.querySelector('#heroTable tbody');
    tbody.innerHTML = '';
    
    const start = (currentPage - 1) * pageSize;
    const end = pageSize === 'all' ? filteredHeroes.length : start + pageSize;
    const heroesToDisplay = filteredHeroes.slice(start, end);

    heroesToDisplay.forEach(hero => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${hero.images.xs}" alt="${hero.name}"></td>
            <td>${hero.name}</td>
            <td>${hero.biography.fullName || 'Unknown'}</td>
            <td>${formatPowerstats(hero.powerstats)}</td>
            <td>${hero.appearance.race || 'Unknown'}</td>
            <td>${hero.appearance.gender || 'Unknown'}</td>
            <td>${hero.appearance.height[1] || 'Unknown'}</td>
            <td>${hero.appearance.weight[1] || 'Unknown'}</td>
            <td>${hero.biography.placeOfBirth || 'Unknown'}</td>
            <td>${hero.biography.alignment || 'Unknown'}</td>
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
document.querySelector('#search').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredHeroes = heroes.filter(hero => hero.name.toLowerCase().includes(searchTerm));
    currentPage = 1;
    displayTable();
});

// Pagination
document.querySelector('#pageSize').addEventListener('change', function(e) {
    pageSize = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
    currentPage = 1;
    displayTable();
});

function updatePagination() {
    const totalPages = Math.ceil(filteredHeroes.length / pageSize);
    const paginationDiv = document.querySelector('#pagination');
    paginationDiv.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.disabled = i === currentPage;
        button.addEventListener('click', () => {
            currentPage = i;
            displayTable();
        });
        paginationDiv.appendChild(button);
    }
}

// Sort table
document.querySelectorAll('#heroTable th').forEach((th, index) => {
    th.addEventListener('click', () => {
        const column = th.textContent.toLowerCase();
        toggleSort(column);
        displayTable();
    });
});

function toggleSort(column) {
    if (sortOrder.column === column) {
        sortOrder.direction = sortOrder.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortOrder.column = column;
        sortOrder.direction = 'asc';
    }
    filteredHeroes.sort(compareHeroes(sortOrder.column, sortOrder.direction));
}

function compareHeroes(column, direction) {
    return (a, b) => {
        let valA = a[column] || '';
        let valB = b[column] || '';
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (direction === 'asc') {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    };
}

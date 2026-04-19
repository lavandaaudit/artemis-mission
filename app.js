document.addEventListener('DOMContentLoaded', () => {
    loadNasaGallery();
    initMoonTracker();
    initLunarMap();
    loadNasaNews();
    loadWeather();
});

// Simulate real-time Moon data
function initMoonTracker() {
    const illumEl = document.getElementById('tk-illum');
    const distEl = document.getElementById('tk-dist');
    const phaseEl = document.getElementById('tk-phase');
    
    if (!illumEl || !distEl || !phaseEl) return;

    function getMoonPhase() {
        const date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        if (month < 3) { year--; month += 12; }
        month++;
        const c = 365.25 * year;
        const e = 30.6 * month;
        let jd = c + e + day - 694039.09; 
        jd /= 29.5305882; 
        const b = parseInt(jd);
        jd -= b; 
        return jd;
    }

    function updateMoon() {
        const phase = getMoonPhase();
        const baseDist = 384400;
        const distVariation = 21000 * Math.sin(phase * Math.PI * 2);
        const dist = Math.floor(baseDist + distVariation);
        
        let phaseName = 'Новий Місяць';
        if (phase > 0.03 && phase < 0.22) phaseName = 'Молодик (Зростаючий)';
        else if (phase >= 0.22 && phase < 0.28) phaseName = 'Перша Чверть';
        else if (phase >= 0.28 && phase < 0.47) phaseName = 'Прибуваючий Місяць';
        else if (phase >= 0.47 && phase < 0.53) phaseName = 'Повня';
        else if (phase >= 0.53 && phase < 0.72) phaseName = 'Спадний Місяць';
        else if (phase >= 0.72 && phase < 0.78) phaseName = 'Остання Чверть';
        else if (phase >= 0.78 && phase < 0.97) phaseName = 'Старий Місяць';
        
        const illum = (Math.abs(Math.cos(phase * Math.PI * 2 - Math.PI)) * 100).toFixed(1);

        illumEl.innerText = illum + '%';
        distEl.innerText = dist.toLocaleString() + ' км';
        phaseEl.innerText = phaseName;
    }
    
    updateMoon();
    setInterval(updateMoon, 60000); // Update every minute
}

// Map initialization
function initLunarMap() {
    const mapEl = document.getElementById('lunar-map');
    if (!mapEl) return;
    
    const map = L.map('lunar-map', {
        center: [0, 0],
        zoom: 3,
        minZoom: 2,
        maxZoom: 7
    });

    // OpenPlanetary moon tiles
    L.tileLayer('https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenPlanetaryMap',
        tms: false,
        noWrap: true
    }).addTo(map);

    // Apollo landing coordinates (lat, lng)
    const apolloSites = [
        { name: "Apollo 11", coords: [0.6740, 23.4720] },
        { name: "Apollo 12", coords: [-3.0124, -23.4216] },
        { name: "Apollo 14", coords: [-3.6453, -17.4714] },
        { name: "Apollo 15", coords: [26.1322, 3.6339] },
        { name: "Apollo 16", coords: [-8.9730, 15.5002] },
        { name: "Apollo 17", coords: [20.1908, 30.7717] }
    ];

    apolloSites.forEach(site => {
        L.marker(site.coords).addTo(map).bindPopup(`<b>${site.name}</b><br>Історична посадка`);
    });

    // Artemis III
    const artemisIcon = L.divIcon({
        className: 'artemis-marker',
        html: '<div class="neon-dot"></div>',
        iconSize: [15, 15],
        iconAnchor: [7.5, 7.5]
    });

    L.marker([-89.9, 0], {icon: artemisIcon}).addTo(map).bindPopup(`<b>Artemis III</b><br>Запланована посадка (Південний полюс)`);
}





// Helper to format Date: YYYY-MM-DD -> DD Місяць YYYY
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', options);
}

// Fetch live images from NASA API
let nasaGalleryItems = [];

async function loadNasaGallery() {
    const container = document.getElementById('gallery-container');
    const apiUrl = 'https://images-api.nasa.gov/search?q=space%20moon%20artemis&media_type=image';
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Save items with images
        nasaGalleryItems = data.collection.items.filter(item => item.links && item.links.length > 0);
        
        renderRandomGallery();
        
        // Re-roll gallery every 5 minutes (300000 ms)
        setInterval(renderRandomGallery, 300000);
        
    } catch (error) {
        console.error("Error loading NASA gallery:", error);
        container.innerHTML = `<div class="loading-state">Сталася помилка при завантаженні галереї NASA. Перевірте підключення до мережі.</div>`;
    }
}

function renderRandomGallery() {
    const container = document.getElementById('gallery-container');
    container.innerHTML = '';
    
    if (nasaGalleryItems.length === 0) return;
    
    // Copy and shuffle array
    const shuffled = [...nasaGalleryItems].sort(() => 0.5 - Math.random());
    const items = shuffled.slice(0, 36);
    
    items.forEach(item => {
        try {
            const title = item.data[0].title.replace(/"/g, '&quot;');
            const thumbUrl = item.links[0].href;
            
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            // Standard NASA fallback SVG
            const fallbackLogo = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230b0c10'/><circle cx='50' cy='50' r='30' fill='none' stroke='%2345A29E' stroke-width='3'/></svg>`;

            galleryItem.innerHTML = `
                <img src="${thumbUrl}" alt="${title}" loading="lazy" 
                     onerror="this.onerror=null; this.src='${fallbackLogo}';" 
                     onclick="openModal('${thumbUrl}')"/>
                <div class="gallery-overlay"><h4>${title}</h4></div>
            `;
            
            container.appendChild(galleryItem);
        } catch (e) {
            // skip items without valid data
        }
    });
}

// Modal functions for gallery
function openModal(imgUrl) {
    let modal = document.getElementById('image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.className = 'modal glassmorphism';
        modal.innerHTML = `
            <span class="close-modal" onclick="closeModal()">&times;</span>
            <img id="modal-img" src="" alt="Enlarged image" />
        `;
        document.body.appendChild(modal);
    }
    document.getElementById('modal-img').src = imgUrl;
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Load NASA RSS News
async function loadNasaNews() {
    const container = document.getElementById('news-container');
    const rssUrl = encodeURIComponent('https://www.nasa.gov/feed/');
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.status !== "ok") throw new Error("RSS parse failed");
        
        container.innerHTML = '';
        const items = data.items.slice(0, 4);
        
        items.forEach(item => {
            const date = new Date(item.pubDate).toLocaleDateString('uk-UA');
            container.innerHTML += `
                <div class="news-item">
                    <div class="news-date">${date}</div>
                    <h4><a href="${item.link}" target="_blank">${item.title}</a></h4>
                </div>
            `;
        });
        
    } catch (error) {
        console.error("News error:", error);
        container.innerHTML = `<p class="loading-state">Не вдалося завантажити новини.</p>`;
    }
}

// Load Space Weather (NOAA Kp index)
async function loadWeather() {
    const container = document.getElementById('weather-container');
    const apiUrl = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Data is an array of objects: {time_tag, Kp, a_running, station_count}
        // Get the latest observation
        const latest = data[data.length - 1];
        const kpIndex = parseFloat(latest.Kp);
        
        // Determine status based on Kp index scale
        let icon = '🌌';
        let status = 'Спокійно';
        let color = 'var(--text-primary)';
        
        if (kpIndex >= 5) {
            icon = '⚠️';
            status = 'Геомагнітна буря (G' + (Math.floor(kpIndex) - 4) + ')';
            color = '#ff4a4a';
        } else if (kpIndex >= 4) {
            icon = '⚡';
            status = 'Обурене поле';
            color = '#ffcc00';
        }
        
        container.innerHTML = `
            <div class="weather-icon">${icon}</div>
            <div class="weather-temp" style="color: ${color}">Kp ${kpIndex.toFixed(2)}</div>
            <p>Стан магнітосфери: <strong>${status}</strong></p>
            <div class="weather-details">
                <span>Оновлено: ${new Date(latest.time_tag).toLocaleTimeString('uk-UA')}</span>
            </div>
        `;
    } catch (error) {
        console.error("Space Weather error:", error);
        container.innerHTML = `<p class="loading-state">Дані про космічну погоду тимчасово недоступні.</p>`;
    }
}

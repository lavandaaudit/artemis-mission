const fs = require('fs');
const path = require('path');

const TIMELINE_PATH = path.join(__dirname, '../data/timeline.json');

async function fetchDailyData() {
    console.log("Starting daily data fetch for Artemis mission...");
    
    // 1. Fetch latest details from NASA API 
    // We look for 'Artemis' keyword images, descending by date
    const apiUrl = 'https://images-api.nasa.gov/search?q=Artemis&media_type=image';
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to reach NASA API");
        const data = await response.json();
        
        let timeline = [];
        if (fs.existsSync(TIMELINE_PATH)) {
            const raw = fs.readFileSync(TIMELINE_PATH, 'utf-8');
            if (raw) timeline = JSON.parse(raw);
        }

        // 2. Identify newest item
        const items = data.collection.items;
        if (items.length === 0) return;
        
        // Take the top item (just an example of daily fetch logic)
        const latestArchive = items[0];
        const dateCreated = latestArchive.data[0].date_created.split('T')[0];
        
        // 3. Add to timeline if today and doesn't exist
        const today = new Date().toISOString().split('T')[0];
        const alreadyExists = timeline.find(entry => entry.date === dateCreated || entry.description.includes(latestArchive.data[0].title));
        
        // As a cron job it runs daily, if there's a new entry, append it.
        if (!alreadyExists) {
            console.log(`Adding new entry to timeline for ${dateCreated}`);
            
            const newEntry = {
                date: dateCreated,
                title: "Автоматичне оновлення місії",
                description: latestArchive.data[0].title,
                imageUrl: latestArchive.links ? latestArchive.links[0].href : null
            };
            
            timeline.push(newEntry);
            
            // Sort timeline chronologically
            timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Save updated JSON
            fs.writeFileSync(TIMELINE_PATH, JSON.stringify(timeline, null, 2));
            console.log("Successfully updated timeline.json");
        } else {
            console.log("No new updates for today, timeline untouched.");
        }
        
    } catch (error) {
        console.error("Error during execution:", error);
    }
}

fetchDailyData();

import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const listingsGrid = document.getElementById('listingsGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const findNearMeBtn = document.getElementById('findNearMeBtn');

let allListings = [];

// Define formatCurrency function
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'NPR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Render UI Cards
const renderCards = (listings) => {
    listingsGrid.innerHTML = '';
    
    if (listings.length === 0) {
        listingsGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    listingsGrid.classList.remove('hidden');

    listings.forEach(listing => {
        const data = listing.data;
        const fallbackImage = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
        const imageUrl = data.imageUrl || ((data.mapLink && (data.mapLink.includes('jpg') || data.mapLink.includes('png') || data.mapLink.includes('unsplash'))) ? data.mapLink : fallbackImage);
        const negBdg = data.priceNegotiable ? `<span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full ml-2">Negotiable</span>` : '';

        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl transition-shadow flex flex-col";
        
        card.innerHTML = `
            <div class="h-48 overflow-hidden relative">
                <img src="${imageUrl}" alt="Land" class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500">
                <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-slate-800 shadow-sm border border-white/20">
                    ${data.landSizeValue} ${data.landSizeUnit}
                </div>
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <div class="flex items-center gap-1 text-slate-500 text-sm mb-2 font-medium">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    ${data.localArea}, ${data.city}
                </div>
                <h3 class="text-2xl font-bold text-slate-800 mb-1 flex items-center">
                    ${formatCurrency(data.expectedPrice)}
                    ${negBdg}
                </h3>
                
                <div class="mt-4 grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-slate-600 border-t border-slate-100 pt-4 flex-1">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                        <span class="truncate" title="${data.roadAccess}">${data.roadAccess}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        <span class="truncate">${data.ownerName}</span>
                    </div>
                </div>

                <div class="mt-6">
                    <button class="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-colors reveal-btn" data-contact="${data.contactNumber}">
                        Show Contact Number
                    </button>
                </div>
            </div>
        `;

        listingsGrid.appendChild(card);
    });

    // Attach click events to "Show Contact Number" buttons
    document.querySelectorAll('.reveal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const contact = e.target.getAttribute('data-contact');
            e.target.innerHTML = `<span class="flex items-center justify-center gap-2 text-emerald-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                ${contact}
            </span>`;
            e.target.classList.remove('bg-slate-900', 'hover:bg-slate-800');
            e.target.classList.add('bg-slate-800', 'cursor-default');
        }, { once: true });
    });
};

// Fetch Data
const fetchListings = async () => {
    try {
        const q = query(collection(db, "land_listings"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        allListings = querySnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
        }));

        loadingIndicator.classList.add('hidden');
        renderCards(allListings);
    } catch (error) {
        console.error("Error fetching listings: ", error);
        loadingIndicator.innerHTML = '<p class="text-red-500">Failed to load properties. Check network console.</p>';
    }
};

// Search filtering logic
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
        renderCards(allListings);
        return;
    }
    
    // Filter by area or city
    const filtered = allListings.filter(l => {
        const area = (l.data.localArea || '').toLowerCase();
        const city = (l.data.city || '').toLowerCase();
        return area.includes(term) || city.includes(term);
    });
    
    renderCards(filtered);
});

// Find Near Me logic (Nominatim OpenStreetMap)
findNearMeBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    const originalText = findNearMeBtn.innerHTML;
    findNearMeBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Locating...
    `;
    findNearMeBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            
            // Try to extract city or suburb or locality
            const area = data.address.suburb || data.address.city_district || data.address.city || data.address.town || data.address.village;
            
            if (area) {
                searchInput.value = area;
                // Dispatch input event to trigger filter
                searchInput.dispatchEvent(new Event('input'));
            } else {
                alert("Could not identify specific local area.");
            }
        } catch (error) {
            console.error("Geocoding failed", error);
            alert("Failed to find location. Please try again.");
        } finally {
            findNearMeBtn.innerHTML = originalText;
            findNearMeBtn.disabled = false;
        }

    }, (error) => {
        console.error("Geolocation error:", error);
        alert("Please allow location access to use this feature.");
        findNearMeBtn.innerHTML = originalText;
        findNearMeBtn.disabled = false;
    });
});

// Init
fetchListings();

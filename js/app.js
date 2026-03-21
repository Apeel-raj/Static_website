import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js';

let allData = [];
let unsubscribe = null;
let currentTab = 'requests'; // 'requests' || 'teachers'

const feedContainer = document.getElementById('requests-feed');
const searchBar = document.getElementById('search-bar');
const searchTitle = document.getElementById('search-title');
const detectBtn = document.getElementById('detect-location-btn');
const locationStatus = document.getElementById('location-status');
const emptyState = document.getElementById('empty-state');

const tabRequests = document.getElementById('tab-requests');
const tabTeachers = document.getElementById('tab-teachers');

// Tab Switching Logic
function setTab(tab) {
    currentTab = tab;
    // Update styling
    if (tab === 'requests') {
        tabRequests.className = "w-40 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 bg-indigo-50 text-indigo-700 shadow-inner";
        tabTeachers.className = "w-40 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 text-gray-500 hover:text-gray-700";
        searchTitle.innerHTML = '<span>Find Tuition Requests</span>';
    } else {
        tabTeachers.className = "w-40 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 bg-purple-50 text-purple-700 shadow-inner";
        tabRequests.className = "w-40 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 text-gray-500 hover:text-gray-700";
        searchTitle.innerHTML = '<span>Browse Available Teachers</span>';
    }
    searchBar.value = '';
    
    // Switch unsubscription and listener
    subscribeToData();
}

tabRequests.addEventListener('click', () => setTab('requests'));
tabTeachers.addEventListener('click', () => setTab('teachers'));

// Initial Fetch / Realtime Listener
function subscribeToData() {
    try {
        if (unsubscribe) {
            unsubscribe(); // Clean up old listener
        }
        
        feedContainer.innerHTML = `<div class="col-span-full p-8 text-center text-gray-500 flex flex-col items-center"><svg class="animate-spin h-8 w-8 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading ${currentTab === 'requests' ? 'requests' : 'teachers'}...</div>`;
        emptyState.classList.add('hidden');
        
        const colName = currentTab === 'requests' ? 'tuition_requests' : 'teachers';
        const q = query(collection(db, colName), orderBy('createdAt', 'desc'));
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            allData = [];
            querySnapshot.forEach((doc) => {
                allData.push({ id: doc.id, ...doc.data() });
            });
            // Re-apply current search filter if any
            const term = searchBar.value.toLowerCase().trim();
            filterAndRender(term);
        }, (error) => {
            console.error("Error listening to data: ", error);
            showError("Error connecting to database. Please check Firebase configuration.");
        });
    } catch (error) {
        console.error("Setup error: ", error);
        showError("Invalid Firebase configuration or permissions missing.");
    }
}

function showError(message) {
    feedContainer.innerHTML = `<div class="col-span-full p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100 flex items-center gap-3">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        ${message}
    </div>`;
}

// Render UI Cards
function renderCards(data) {
    feedContainer.innerHTML = '';
    
    if (data.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        
        data.forEach(item => {
            const card = document.createElement('div');
            
            if (currentTab === 'requests') {
                // Request Card (Student/Parent)
                card.className = 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden text-left group';
                card.innerHTML += `<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>`;
                
                card.innerHTML += `
                    <div class="flex justify-between items-start mb-5">
                        <div>
                            <h3 class="font-bold text-gray-900 text-lg leading-tight mb-1">${item.classGrade}</h3>
                            <p class="text-sm text-gray-500 font-medium">${item.studentName}</p>
                        </div>
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50/80 text-indigo-600 border border-indigo-100/50">
                            ${item.city}
                        </span>
                    </div>
                    
                    <div class="space-y-3 mb-6 flex-grow bg-gray-50/50 rounded-xl p-3.5 border border-gray-50">
                        <div class="flex items-center text-sm text-gray-700">
                            <svg class="w-4 h-4 mr-2.5 text-indigo-400 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span class="font-semibold">${item.localArea}</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-700">
                            <svg class="w-4 h-4 mr-2.5 text-green-500 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span class="font-semibold">Rs. ${item.salary}</span>
                            ${item.negotiable ? '<span class="text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-100/80 px-1.5 py-0.5 rounded-sm ml-2">Negotiable</span>' : ''}
                        </div>
                    </div>
                    
                    <a href="${item.contactInfo ? (item.contactInfo.includes('@') ? 'mailto:'+item.contactInfo : 'tel:'+item.contactInfo) : '#'}" class="w-full mt-auto bg-white hover:bg-indigo-50 text-indigo-600 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 border-2 border-indigo-50 hover:border-indigo-100 text-sm flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600">
                        <span>Contact Parent</span>
                        <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    </a>
                `;
            } else {
                // Teacher Card
                card.className = 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden text-left group';
                card.innerHTML += `<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>`;
                
                card.innerHTML += `
                    <div class="flex items-center gap-4 mb-4">
                        <div class="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xl uppercase self-start">
                            ${item.fullName.charAt(0)}
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 text-lg leading-tight mb-0.5">${item.fullName}</h3>
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-purple-50 text-purple-600">
                                Verified Teacher
                            </span>
                        </div>
                    </div>
                    
                    <div class="space-y-3 mb-6 flex-grow">
                        <div>
                            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bio</p>
                            <p class="text-sm text-gray-700 leading-relaxed">${item.bio}</p>
                        </div>
                        <div>
                            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Experience</p>
                            <p class="text-sm text-gray-700 leading-relaxed">${item.experience}</p>
                        </div>
                    </div>
                    
                    <a href="${item.contactInfo ? (item.contactInfo.includes('@') ? 'mailto:'+item.contactInfo : 'tel:'+item.contactInfo) : '#'}" class="w-full mt-auto bg-white hover:bg-purple-50 text-purple-600 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 border-2 border-purple-50 hover:border-purple-100 text-sm flex items-center justify-center gap-2 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600">
                        <span>Contact Teacher</span>
                        <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    </a>
                `;
            }
            
            feedContainer.appendChild(card);
        });
    }
}

function filterAndRender(term) {
    if (!term) {
        renderCards(allData);
        return;
    }
    const filtered = allData.filter(item => {
        if (currentTab === 'requests') {
            return (item.localArea && item.localArea.toLowerCase().includes(term)) ||
                   (item.city && item.city.toLowerCase().includes(term)) ||
                   (item.classGrade && item.classGrade.toLowerCase().includes(term)) ||
                   (item.studentName && item.studentName.toLowerCase().includes(term));
        } else {
            return (item.fullName && item.fullName.toLowerCase().includes(term)) ||
                   (item.bio && item.bio.toLowerCase().includes(term)) ||
                   (item.experience && item.experience.toLowerCase().includes(term));
        }
    });
    renderCards(filtered);
}

// Search Filter Logic
searchBar.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    filterAndRender(term);
});

// Auto-detect Location Logic
detectBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showLocationStatus('Geolocation is not supported by your browser.', true);
        return;
    }
    
    detectBtn.disabled = true;
    detectBtn.classList.add('opacity-75');
    detectBtn.innerHTML = `<svg class="animate-spin h-5 w-5 text-indigo-700 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="ml-2">Detecting...</span>`;
    showLocationStatus('Finding your location...');
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                // Use OpenStreetMap Nominatim API
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                
                const response = await fetch(url, { headers: { 'Accept-Language': 'en-US,en;q=0.9' }});
                const data = await response.json();
                
                if (data && data.address) {
                    const address = data.address;
                    const area = address.suburb || address.neighbourhood || address.city_district || address.village || address.town || address.county || address.city || '';
                    
                    if (area) {
                        searchBar.value = area;
                        searchBar.dispatchEvent(new Event('input'));
                        showLocationStatus(`Area detected: ${area}`, false, true);
                    } else {
                        showLocationStatus('Could not define a specific local area.', true);
                    }
                } else {
                    showLocationStatus('Map service did not return valid data.', true);
                }
            } catch (err) {
                console.error(err);
                showLocationStatus('Error fetching location data from map service.', true);
            } finally {
                resetDetectBtn();
            }
        },
        (error) => {
            console.error(error);
            showLocationStatus('Location access denied or unavailable.', true);
            resetDetectBtn();
        },
        { timeout: 10000, maximumAge: 60000 }
    );
});

function showLocationStatus(message, isError = false, isSuccess = false) {
    locationStatus.textContent = message;
    locationStatus.className = 'text-sm font-medium mt-3 flex items-center gap-1.5';
    
    if (isError) {
        locationStatus.classList.add('text-red-500');
        locationStatus.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${message}`;
    } else if (isSuccess) {
        locationStatus.classList.add('text-green-600');
        locationStatus.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> ${message}`;
    } else {
        locationStatus.classList.add('text-indigo-500');
        locationStatus.innerHTML = `<span class="relative flex h-3 w-3 mr-1"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span> ${message}`;
    }
}

function resetDetectBtn() {
    detectBtn.disabled = false;
    detectBtn.classList.remove('opacity-75');
    detectBtn.innerHTML = `<span>📍 Auto-detect Area</span>`;
}

// Initialize Real-time Listener on the default tab
subscribeToData();

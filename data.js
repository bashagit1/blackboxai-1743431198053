// VitalCare - Data Management Module
class VitalCare {
    constructor() {
        this.entries = JSON.parse(localStorage.getItem('vitalEntries')) || [];
        this.initSampleData();
    }

    // Initialize with sample data if empty
    initSampleData() {
        if (this.entries.length === 0) {
            const now = new Date();
            const sampleData = [
                {
                    id: this.generateId(),
                    date: new Date(now.getTime() - 86400000).toISOString(), // Yesterday
                    systolic: 120,
                    diastolic: 80,
                    pulse: 72,
                    spo2: 98,
                    temperature: 36.5,
                    glucose: 92,
                    notes: "Morning reading before breakfast"
                },
                {
                    id: this.generateId(),
                    date: new Date(now.getTime() - 43200000).toISOString(), // 12 hours ago
                    systolic: 118,
                    diastolic: 78,
                    pulse: 75,
                    spo2: 97,
                    temperature: 36.7,
                    glucose: 88,
                    notes: "Evening reading after dinner"
                },
                {
                    id: this.generateId(),
                    date: now.toISOString(),
                    systolic: 122,
                    diastolic: 82,
                    pulse: 70,
                    spo2: 98,
                    temperature: 36.6,
                    glucose: 95,
                    notes: "Current reading"
                }
            ];
            this.entries = sampleData;
            this.saveToLocalStorage();
        }
    }

    // Generate unique ID for each entry
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Save all entries to localStorage
    saveToLocalStorage() {
        localStorage.setItem('vitalEntries', JSON.stringify(this.entries));
    }

    // Add new vital signs entry
    addEntry(entryData) {
        const newEntry = {
            id: this.generateId(),
            date: new Date().toISOString(),
            ...entryData
        };
        this.entries.unshift(newEntry); // Add to beginning of array
        this.saveToLocalStorage();
        return newEntry;
    }

    // Get all entries sorted by date (newest first)
    getAllEntries() {
        return [...this.entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Filter entries by date range
    getEntriesByDateRange(startDate, endDate) {
        return this.getAllEntries().filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
        });
    }

    // Search entries by keyword in notes
    searchEntries(keyword) {
        const searchTerm = keyword.toLowerCase();
        return this.getAllEntries().filter(entry => 
            entry.notes && entry.notes.toLowerCase().includes(searchTerm)
        );
    }

    // Delete an entry by ID
    deleteEntry(id) {
        this.entries = this.entries.filter(entry => entry.id !== id);
        this.saveToLocalStorage();
    }

    // Export entries to CSV format
    exportToCSV() {
        const headers = [
            'Date', 'Systolic (mmHg)', 'Diastolic (mmHg)', 'Pulse (bpm)', 
            'SpO₂ (%)', 'Temperature (°C)', 'Glucose (mg/dL)', 'Notes'
        ].join(',');

        const rows = this.getAllEntries().map(entry => {
            const date = new Date(entry.date).toLocaleString();
            return [
                `"${date}"`,
                entry.systolic,
                entry.diastolic,
                entry.pulse,
                entry.spo2,
                entry.temperature,
                entry.glucose,
                `"${entry.notes || ''}"`
            ].join(',');
        }).join('\n');

        return `${headers}\n${rows}`;
    }

    // Get vital status (normal, warning, danger)
    getVitalStatus(entry) {
        // BP classification
        const isBpNormal = entry.systolic >= 90 && entry.systolic <= 140 && 
                          entry.diastolic >= 60 && entry.diastolic <= 90;
        const isBpWarning = (entry.systolic > 140 && entry.systolic <= 160) || 
                           (entry.diastolic > 90 && entry.diastolic <= 100);
        
        // Pulse classification
        const isPulseNormal = entry.pulse >= 60 && entry.pulse <= 100;
        
        // SpO2 classification
        const isSpo2Normal = entry.spo2 >= 95;
        const isSpo2Warning = entry.spo2 >= 90 && entry.spo2 < 95;
        
        // Temperature classification
        const isTempNormal = entry.temperature >= 36 && entry.temperature <= 37.5;
        
        // Glucose classification
        const isGlucoseNormal = entry.glucose >= 70 && entry.glucose <= 100;
        const isGlucoseWarning = (entry.glucose > 100 && entry.glucose <= 125) || 
                                (entry.glucose >= 50 && entry.glucose < 70);

        if (!isBpNormal || !isPulseNormal || !isSpo2Normal || !isTempNormal || !isGlucoseNormal) {
            if (isBpWarning || isSpo2Warning || isGlucoseWarning) {
                return 'warning';
            }
            return 'danger';
        }
        return 'normal';
    }
}

// Initialize VitalCare instance
const vitalCare = new VitalCare();

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Dashboard Page
    if (document.getElementById('recentEntries')) {
        updateDashboard();
    }

    // History Page
    if (document.getElementById('historyTable')) {
        updateHistoryTable();
    }
});

// Update Dashboard with recent entries
function updateDashboard() {
    const recentEntries = vitalCare.getAllEntries().slice(0, 5);
    const tableBody = document.getElementById('recentEntries');
    
    tableBody.innerHTML = recentEntries.map(entry => {
        const date = new Date(entry.date).toLocaleString();
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${entry.systolic}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.diastolic}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.pulse}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.spo2}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button onclick="viewEntry('${entry.id}')" class="text-blue-600 hover:text-blue-900">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update History Table with all entries
function updateHistoryTable(filteredEntries = null) {
    const entries = filteredEntries || vitalCare.getAllEntries();
    const tableBody = document.getElementById('historyTable');
    
    tableBody.innerHTML = entries.map(entry => {
        const date = new Date(entry.date).toLocaleString();
        const status = vitalCare.getVitalStatus(entry);
        const statusClass = `status-${status}`;
        const statusIcon = status === 'normal' ? 'fa-check-circle' : 
                         status === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle';
        const statusText = status === 'normal' ? 'Normal' : 
                         status === 'warning' ? 'Warning' : 'Danger';

        return `
            <tr class="table-row">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${entry.systolic}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.diastolic}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.pulse}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.spo2}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.temperature}°C</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.glucose}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">
                    <i class="fas ${statusIcon}"></i> ${statusText}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button onclick="viewEntry('${entry.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="deleteEntry('${entry.id}')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// View entry details
function viewEntry(id) {
    const entry = vitalCare.getAllEntries().find(e => e.id === id);
    if (entry) {
        alert(`Entry Details:\n
Date: ${new Date(entry.date).toLocaleString()}\n
Systolic: ${entry.systolic} mmHg\n
Diastolic: ${entry.diastolic} mmHg\n
Pulse: ${entry.pulse} bpm\n
SpO₂: ${entry.spo2}%\n
Temperature: ${entry.temperature}°C\n
Glucose: ${entry.glucose} mg/dL\n
Notes: ${entry.notes || 'N/A'}`);
    }
}

// Delete entry
function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        vitalCare.deleteEntry(id);
        if (document.getElementById('recentEntries')) {
            updateDashboard();
        }
        if (document.getElementById('historyTable')) {
            updateHistoryTable();
        }
    }
}

// Export to CSV
function exportToCSV() {
    const csvContent = vitalCare.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vitalcare_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Form submission for add-entry.html
if (document.getElementById('vitalForm')) {
    document.getElementById('vitalForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const entryData = {
            systolic: parseInt(document.getElementById('systolic').value),
            diastolic: parseInt(document.getElementById('diastolic').value),
            pulse: parseInt(document.getElementById('pulse').value),
            spo2: parseInt(document.getElementById('spo2').value),
            temperature: parseFloat(document.getElementById('temperature').value),
            glucose: parseInt(document.getElementById('glucose').value),
            notes: document.getElementById('notes').value
        };

        vitalCare.addEntry(entryData);
        alert('Entry saved successfully!');
        window.location.href = 'dashboard.html';
    });
}

// Filter and search functionality for history.html
if (document.getElementById('applyFilter')) {
    document.getElementById('applyFilter').addEventListener('click', function() {
        const startDate = document.getElementById('dateFrom').value;
        const endDate = document.getElementById('dateTo').value;
        const filteredEntries = vitalCare.getEntriesByDateRange(startDate, endDate);
        updateHistoryTable(filteredEntries);
    });

    document.getElementById('searchInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            const keyword = this.value.trim();
            if (keyword) {
                const filteredEntries = vitalCare.searchEntries(keyword);
                updateHistoryTable(filteredEntries);
            } else {
                updateHistoryTable();
            }
        }
    });
}

// Export button functionality
if (document.getElementById('exportBtn')) {
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
}
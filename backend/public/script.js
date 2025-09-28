// Global state
let activities = [];
let currentFilter = 'all';

// Activity options data
const ACTIVITY_OPTIONS = {
  transport: [
    { value: 'car-petrol', label: '🚗 Car (Petrol)', unit: 'km' },
    { value: 'car-diesel', label: '🚗 Car (Diesel)', unit: 'km' },
    { value: 'car-electric', label: '🔋 Car (Electric)', unit: 'km' },
    { value: 'bus', label: '🚌 Bus', unit: 'km' },
    { value: 'train', label: '🚆 Train', unit: 'km' },
    { value: 'flight-domestic', label: '✈️ Flight (Domestic)', unit: 'km' },
    { value: 'flight-international', label: '🌍 Flight (International)', unit: 'km' },
    { value: 'motorcycle', label: '🏍️ Motorcycle', unit: 'km' },
    { value: 'bicycle', label: '🚴 Bicycle', unit: 'km' },
    { value: 'walking', label: '🚶 Walking', unit: 'km' }
  ],
  energy: [
    { value: 'electricity', label: '⚡ Electricity', unit: 'kWh' },
    { value: 'natural-gas', label: '🔥 Natural Gas', unit: 'kWh' },
    { value: 'heating-oil', label: '🛢️ Heating Oil', unit: 'liters' },
    { value: 'coal', label: '⚫ Coal', unit: 'kg' },
    { value: 'solar', label: '☀️ Solar', unit: 'kWh' },
    { value: 'wind', label: '💨 Wind', unit: 'kWh' }
  ],
  food: [
    { value: 'beef', label: '🥩 Beef', unit: 'kg' },
    { value: 'pork', label: '🐷 Pork', unit: 'kg' },
    { value: 'chicken', label: '🐔 Chicken', unit: 'kg' },
    { value: 'fish', label: '🐟 Fish', unit: 'kg' },
    { value: 'dairy', label: '🥛 Dairy Products', unit: 'kg' },
    { value: 'vegetables', label: '🥬 Vegetables', unit: 'kg' },
    { value: 'fruits', label: '🍎 Fruits', unit: 'kg' },
    { value: 'grains', label: '🌾 Grains', unit: 'kg' },
    { value: 'processed-food', label: '🍕 Processed Food', unit: 'kg' }
  ],
  waste: [
    { value: 'general-waste', label: '🗑️ General Waste', unit: 'kg' },
    { value: 'recycling', label: '♻️ Recycling', unit: 'kg' },
    { value: 'compost', label: '🌱 Compost', unit: 'kg' },
    { value: 'electronic-waste', label: '📱 Electronic Waste', unit: 'kg' },
    { value: 'plastic', label: '🛍️ Plastic Waste', unit: 'kg' }
  ]
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  loadActivities();
  updateChart();
}

function setupEventListeners() {
  const categorySelect = document.getElementById('category');
  if (categorySelect) {
    categorySelect.addEventListener('change', updateActivityOptions);
  }
}

// Update activity dropdown based on category selection
function updateActivityOptions() {
  const categorySelect = document.getElementById('category');
  const activitySelect = document.getElementById('activity');
  const amountInput = document.getElementById('amount');
  
  const selectedCategory = categorySelect.value;
  
  // Clear activity dropdown
  activitySelect.innerHTML = '<option value="">Select an activity</option>';
  
  if (selectedCategory && ACTIVITY_OPTIONS[selectedCategory]) {
    const options = ACTIVITY_OPTIONS[selectedCategory];
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      optionElement.dataset.unit = option.unit;
      activitySelect.appendChild(optionElement);
    });
    
    // Update placeholder for amount input
    if (options.length > 0) {
      amountInput.placeholder = `Enter amount in ${options[0].unit}`;
    }
  }
  
  // Update amount placeholder when activity changes
  activitySelect.addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption && selectedOption.dataset.unit) {
      amountInput.placeholder = `Enter amount in ${selectedOption.dataset.unit}`;
    }
  });
}

// Add activity function
async function addActivity() {
  const category = document.getElementById('category').value;
  const activityType = document.getElementById('activity').value;
  const amount = parseFloat(document.getElementById('amount').value);
  
  // Validation
  if (!category) {
    alert('Please select a category');
    return;
  }
  
  if (!activityType) {
    alert('Please select an activity');
    return;
  }
  
  if (!amount || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  try {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        activityType,
        amount
      })
    });
    
    if (response.status === 401) {
      // User not logged in, save to local storage for demo
      const activity = {
        id: Date.now().toString(),
        category,
        activityType,
        amount,
        emissions: calculateLocalEmissions(category, activityType, amount),
        date: new Date()
      };
      
      activities.push(activity);
      saveActivitiesToLocal();
      
      // Clear form
      clearForm();
      
      // Update UI
      displayActivities();
      updateTotalEmissions();
      updateChart();
      
      return;
    }
    
    if (!response.ok) {
      throw new Error('Failed to add activity');
    }
    
    const data = await response.json();
    
    // Clear form
    clearForm();
    
    // Reload activities
    loadActivities();
    
  } catch (error) {
    console.error('Error adding activity:', error);
    alert('Error adding activity. Please try again.');
  }
}

// Calculate emissions locally (for demo purposes)
function calculateLocalEmissions(category, activityType, amount) {
  const EMISSION_FACTORS = {
    transport: {
      'car-petrol': 0.21, 'car-diesel': 0.17, 'car-electric': 0.05,
      'bus': 0.08, 'train': 0.04, 'flight-domestic': 0.25,
      'flight-international': 0.15, 'motorcycle': 0.13, 'bicycle': 0, 'walking': 0
    },
    energy: {
      'electricity': 0.5, 'natural-gas': 0.18, 'heating-oil': 0.27,
      'coal': 0.35, 'solar': 0.05, 'wind': 0.01
    },
    food: {
      'beef': 60, 'pork': 12, 'chicken': 6, 'fish': 5, 'dairy': 3.2,
      'vegetables': 2, 'fruits': 1.1, 'grains': 1.4, 'processed-food': 4
    },
    waste: {
      'general-waste': 0.5, 'recycling': 0.1, 'compost': 0.05,
      'electronic-waste': 2, 'plastic': 3
    }
  };
  
  return amount * (EMISSION_FACTORS[category]?.[activityType] || 0);
}

function clearForm() {
  document.getElementById('category').value = '';
  document.getElementById('activity').innerHTML = '<option value="">Select an activity</option>';
  document.getElementById('amount').value = '';
  document.getElementById('amount').placeholder = 'Enter amount';
}

// Load activities
async function loadActivities() {
  try {
    const response = await fetch('/api/activities');
    
    if (response.status === 401) {
      // User not logged in, load from local storage
      loadActivitiesFromLocal();
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      activities = data;
    }
  } catch (error) {
    console.error('Error loading activities:', error);
    // Fallback to local storage
    loadActivitiesFromLocal();
  }
  
  displayActivities();
  updateTotalEmissions();
  updateChart();
}

function loadActivitiesFromLocal() {
  const saved = localStorage.getItem('carbonActivities');
  activities = saved ? JSON.parse(saved) : [];
}

function saveActivitiesToLocal() {
  localStorage.setItem('carbonActivities', JSON.stringify(activities));
}

// Display activities
function displayActivities() {
  const activitiesList = document.getElementById('activitiesList');
  
  if (!activitiesList) return;
  
  const filteredActivities = currentFilter === 'all' 
    ? activities 
    : activities.filter(activity => activity.category === currentFilter);
  
  if (filteredActivities.length === 0) {
    activitiesList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px">No activities found.</p>';
    return;
  }
  
  const activitiesHTML = filteredActivities.map(activity => {
    const activityLabel = getActivityLabel(activity.category, activity.activityType);
    const date = new Date(activity.date).toLocaleDateString();
    
    return `
      <div class="activity-item" data-category="${activity.category}">
        <div class="activity-info">
          <div class="activity-name">${activityLabel}</div>
          <div class="activity-details">${activity.amount} ${getActivityUnit(activity.category, activity.activityType)} • ${date}</div>
        </div>
        <div>
          <span class="activity-emissions">${activity.emissions.toFixed(2)} kg CO₂</span>
          <button class="delete-btn" onclick="deleteActivity('${activity.id || activity._id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
  
  activitiesList.innerHTML = activitiesHTML;
}

function getActivityLabel(category, activityType) {
  const options = ACTIVITY_OPTIONS[category];
  if (!options) return activityType;
  
  const option = options.find(opt => opt.value === activityType);
  return option ? option.label : activityType;
}

function getActivityUnit(category, activityType) {
  const options = ACTIVITY_OPTIONS[category];
  if (!options) return '';
  
  const option = options.find(opt => opt.value === activityType);
  return option ? option.unit : '';
}

// Delete activity
async function deleteActivity(activityId) {
  try {
    const response = await fetch(`/api/activities/${activityId}`, {
      method: 'DELETE'
    });
    
    if (response.status === 401) {
      // User not logged in, delete from local storage
      activities = activities.filter(activity => activity.id !== activityId);
      saveActivitiesToLocal();
      displayActivities();
      updateTotalEmissions();
      updateChart();
      return;
    }
    
    if (response.ok) {
      loadActivities();
    }
  } catch (error) {
    console.error('Error deleting activity:', error);
  }
}

// Filter activities
function filterActivities(category) {
  currentFilter = category;
  
  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  event.target.classList.add('active');
  
  displayActivities();
  updateChart();
}

// Update total emissions
function updateTotalEmissions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayActivities = activities.filter(activity => {
    const activityDate = new Date(activity.date);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime();
  });
  
  const totalEmissions = todayActivities.reduce((sum, activity) => sum + activity.emissions, 0);
  
  const totalElement = document.getElementById('totalEmissions');
  if (totalElement) {
    totalElement.textContent = totalEmissions.toFixed(1);
  }
}

// Update chart
function updateChart() {
  const chartBars = document.getElementById('chartBars');
  if (!chartBars) return;
  
  const filteredActivities = currentFilter === 'all' 
    ? activities 
    : activities.filter(activity => activity.category === currentFilter);
  
  // Group by category
  const categoryData = {};
  
  filteredActivities.forEach(activity => {
    if (!categoryData[activity.category]) {
      categoryData[activity.category] = 0;
    }
    categoryData[activity.category] += activity.emissions;
  });
  
  // Find max value for scaling
  const maxEmissions = Math.max(...Object.values(categoryData), 1);
  
  // Create chart bars
  const categories = ['transport', 'energy', 'food', 'waste'];
  const categoryLabels = {
    transport: 'Transport',
    energy: 'Energy',
    food: 'Food',
    waste: 'Waste'
  };
  
  const barsHTML = categories.map(category => {
    const emissions = categoryData[category] || 0;
    const height = (emissions / maxEmissions) * 160; // Max height 160px
    
    return `
      <div class="chart-bar">
        <div class="bar" style="height: ${height}px"></div>
        <div class="bar-label">${categoryLabels[category]}</div>
        <div class="bar-value">${emissions.toFixed(1)} kg</div>
      </div>
    `;
  }).join('');
  
  chartBars.innerHTML = barsHTML;
}
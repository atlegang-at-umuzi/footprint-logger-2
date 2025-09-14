const EMISSION_FACTORS = {
  transport: {
    'car-petrol': { factor: 0.21, unit: 'km' },
    'car-diesel': { factor: 0.17, unit: 'km' },
    'car-electric': { factor: 0.05, unit: 'km' },
    'bus': { factor: 0.08, unit: 'km' },
    'train': { factor: 0.04, unit: 'km' },
    'flight-domestic': { factor: 0.25, unit: 'km' },
    'flight-international': { factor: 0.15, unit: 'km' },
    'motorcycle': { factor: 0.13, unit: 'km' },
    'bicycle': { factor: 0, unit: 'km' },
    'walking': { factor: 0, unit: 'km' }
  },
  energy: {
    'electricity': { factor: 0.5, unit: 'kWh' },
    'natural-gas': { factor: 0.18, unit: 'kWh' },
    'heating-oil': { factor: 0.27, unit: 'liters' },
    'coal': { factor: 0.35, unit: 'kg' },
    'solar': { factor: 0.05, unit: 'kWh' },
    'wind': { factor: 0.01, unit: 'kWh' }
  },
  food: {
    'beef': { factor: 60, unit: 'kg' },
    'pork': { factor: 12, unit: 'kg' },
    'chicken': { factor: 6, unit: 'kg' },
    'fish': { factor: 5, unit: 'kg' },
    'dairy': { factor: 3.2, unit: 'kg' },
    'vegetables': { factor: 2, unit: 'kg' },
    'fruits': { factor: 1.1, unit: 'kg' },
    'grains': { factor: 1.4, unit: 'kg' },
    'processed-food': { factor: 4, unit: 'kg' }
  },
  waste: {
    'general-waste': { factor: 0.5, unit: 'kg' },
    'recycling': { factor: 0.1, unit: 'kg' },
    'compost': { factor: 0.05, unit: 'kg' },
    'electronic-waste': { factor: 2, unit: 'kg' },
    'plastic': { factor: 3, unit: 'kg' }
  }
};

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

const calculateEmissions = (category, activityType, amount) => {
  const factor = EMISSION_FACTORS[category]?.[activityType];
  if (!factor) {
    throw new Error('Invalid activity type');
  }
  return amount * factor.factor;
};

const getActivityOptions = (category) => {
  return ACTIVITY_OPTIONS[category] || [];
};

const getActivityUnit = (category, activityType) => {
  return EMISSION_FACTORS[category]?.[activityType]?.unit || '';
};

module.exports = {
  calculateEmissions,
  getActivityOptions,
  getActivityUnit,
  EMISSION_FACTORS,
  ACTIVITY_OPTIONS
};
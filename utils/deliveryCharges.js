const deliveryCharges = {
  // Metro Cities (Tier 1) - ₹50
  'mumbai': 50,
  'delhi': 50,
  'bangalore': 50,
  'kolkata': 50,
  'chennai': 50,
  'hyderabad': 50,
  'new delhi': 50,

  // Tier 2 Cities - ₹70
  'pune': 70,
  'ahmedabad': 70,
  'surat': 70,
  'lucknow': 70,
  'jaipur': 70,
  'kochi': 70,
  'coimbatore': 70,
  'indore': 70,
  'nagpur': 70,
  'bhopal': 70,
  'visakhapatnam': 70,
  'vadodara': 70,
  'thiruvananthapuram': 70,

  // State Capitals - ₹80
  'panaji': 80,
  'shimla': 80,
  'dehradun': 80,
  'itanagar': 80,
  'dispur': 80,
  'patna': 80,
  'raipur': 80,
  'gandhinagar': 80,
  'chandigarh': 80,
  'ranchi': 80,
  'imphal': 80,
  'shillong': 80,
  'aizawl': 80,
  'kohima': 80,
  'bhubaneswar': 80,
  'gangtok': 80,
  'agartala': 80,
  'port blair': 80,
  'silvassa': 80,
  'kavaratti': 80,
  'puducherry': 80,

  // Other Major Cities - ₹90
  'vijayawada': 90,
  'guntur': 90,
  'nellore': 90,
  'kurnool': 90,
  'rajahmundry': 90,
  'tirupati': 90,
  'kadapa': 90,
  'anantapur': 90,
  'kakinada': 90,
  'guwahati': 90,
  'dibrugarh': 90,
  'silchar': 90,
  'jorhat': 90,
  'tezpur': 90,
  'gaya': 90,
  'bhagalpur': 90,
  'muzaffarpur': 90,
  'darbhanga': 90,
  'bilaspur': 90,
  'bhilai': 90,
  'durg': 90,
  'korba': 90,
  'margao': 90,
  'mapusa': 90,
  'ponda': 90,

  // Default for other cities
  'DEFAULT': 100
};

const getDeliveryCharge = (city, orderAmount = 0) => {
  // Free delivery for orders above ₹5000
  if (orderAmount >= 5000) {
    return {
      charge: 0,
      message: 'Free Delivery on orders above ₹5000'
    };
  }

  if (!city) {
    return {
      charge: deliveryCharges.DEFAULT,
      message: 'Please select a delivery location'
    };
  }

  const normalizedCity = city.trim().toLowerCase();
  const matchedCity = Object.keys(deliveryCharges).find(
    c => c === normalizedCity
  );

  const charge = matchedCity ? deliveryCharges[matchedCity] : deliveryCharges.DEFAULT;
  const message = matchedCity 
    ? `Delivery charge for ${city}: ₹${charge}`
    : `Standard delivery charge: ₹${deliveryCharges.DEFAULT}`;

  return { charge, message };
};

// Cache for storing geocoding results
const locationCache = new Map();

// Function to get coordinates from address using Nominatim
const getCoordinatesFromAddress = async (address) => {
  const cacheKey = address.toLowerCase();
  
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey);
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
    );
    const data = await response.json();

    if (data && data[0]) {
      const result = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        city: data[0].address?.city || data[0].address?.town || data[0].address?.state_district
      };
      
      locationCache.set(cacheKey, result);
      return result;
    }
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
};

module.exports = { 
  getDeliveryCharge,
  getCoordinatesFromAddress,
  deliveryCharges 
}; 
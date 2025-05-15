document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const categoryButtons = document.querySelectorAll('.category-button');
  const restaurantCards = document.querySelectorAll('.restaurant-card');
  const restaurantModal = document.getElementById('restaurant-modal');
  const closeModalButton = document.getElementById('close-modal');
  const navButtons = document.querySelectorAll('.nav-button');
  const sections = document.querySelectorAll('.section');
  const favoriteButtons = document.querySelectorAll('.favorite-button');
  const timeSlots = document.querySelectorAll('.time-slot');
  const decreasePersons = document.getElementById('decrease-persons');
  const increasePersons = document.getElementById('increase-persons');
  const personsCount = document.getElementById('persons-count');
  const vegToggle = document.getElementById('veg-toggle');
  const bookButton = document.querySelector('.primary-button.full-width');

  // API Configuration
  const API_BASE_URL = 'http://localhost:5000/api';
  const CURRENT_USER_ID = 'default_user'; // Replace with actual user ID in a real app

  // Initialize page
  initPage();

  // Search functionality
  searchInput?.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    filterRestaurants(searchTerm, vegToggle?.checked);
  });
  
  // Category filtering
  categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
      const category = this.getAttribute('data-category');
      
      // Update active state
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filter restaurants
      filterRestaurantsByCategory(category);
      
      // Re-apply vegetarian filter if active
      if (vegToggle?.checked) {
        applyVegetarianFilter();
      }
    });
  });
  
  // Vegetarian filter toggle
  vegToggle?.addEventListener('change', function() {
    applyVegetarianFilter();
  });

  // Restaurant card click - open modal
  restaurantCards.forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.closest('.favorite-button')) return;
      
      openRestaurantModal(
        this.querySelector('.restaurant-name').textContent,
        this.querySelector('.restaurant-image').style.backgroundImage,
        this.getAttribute('data-vegetarian') === 'true'
      );
    });
  });
  
  // Close modal
  closeModalButton?.addEventListener('click', closeRestaurantModal);
  
  // Navigation
  navButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetSection = this.getAttribute('data-section');
      switchSection(targetSection);
    });
  });
  
  // Favorites functionality
  favoriteButtons.forEach(button => {
    button.addEventListener('click', async function(e) {
      e.stopPropagation();
      
      const restaurantCard = this.closest('.restaurant-card');
      const restaurantId = restaurantCard.getAttribute('data-id');
      const isActive = !this.classList.contains('active');
      
      try {
        const action = isActive ? 'add' : 'remove';
        const restaurantData = getRestaurantData(restaurantCard);
        
        const response = await fetch(`${API_BASE_URL}/favorites?user_id=${CURRENT_USER_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, restaurant: restaurantData })
        });
        
        if (response.ok) {
          updateFavoriteUI(this, restaurantCard, isActive);
        } else {
          console.error('Failed to update favorites');
        }
      } catch (error) {
        console.error('Error updating favorites:', error);
      }
    });
  });
  
  // Time slots selection
  timeSlots.forEach(slot => {
    slot.addEventListener('click', function() {
      timeSlots.forEach(s => s.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // Person counter
  let persons = 2;
  decreasePersons?.addEventListener('click', () => {
    if (persons > 1) {
      persons--;
      updatePersonsCount();
    }
  });
  
  increasePersons?.addEventListener('click', () => {
    if (persons < 8) {
      persons++;
      updatePersonsCount();
    }
  });

  // Book a Table functionality
  bookButton?.addEventListener('click', async function(e) {
    e.preventDefault();
    
    const selectedTimeSlot = document.querySelector('.time-slot.active')?.textContent;
    if (!selectedTimeSlot) {
      alert('Please select a time slot');
      return;
    }
    
    try {
      const reservationData = createReservationData(selectedTimeSlot);
      const response = await fetch(`${API_BASE_URL}/reservations?user_id=${CURRENT_USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', reservation: reservationData })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          addReservationToUI(reservationData);
          closeRestaurantModal();
          alert(`Reservation confirmed at ${reservationData.restaurantName} for ${selectedTimeSlot}`);
        }
      } else {
        alert('Failed to create reservation');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Error creating reservation');
    }
  });

  // Helper Functions
  async function initPage() {
    try {
      const [favorites, reservations] = await Promise.all([
        fetchFavorites(),
        fetchReservations()
      ]);
      
      updateFavoritesUI(favorites);
      updateReservationsUI(reservations);
    } catch (error) {
      console.error('Error initializing page:', error);
    }
  }

  async function fetchFavorites() {
    const response = await fetch(`${API_BASE_URL}/favorites?user_id=${CURRENT_USER_ID}`);
    const data = await response.json();
    return data.favorites || [];
  }

  async function fetchReservations() {
    const response = await fetch(`${API_BASE_URL}/reservations?user_id=${CURRENT_USER_ID}`);
    const data = await response.json();
    return data.reservations || [];
  }

  function filterRestaurants(searchTerm, vegOnly = false) {
    restaurantCards.forEach(card => {
      const name = card.querySelector('.restaurant-name').textContent.toLowerCase();
      const categories = card.getAttribute('data-categories').toLowerCase();
      const address = card.querySelector('.restaurant-address').textContent.toLowerCase();
      const isVeg = card.getAttribute('data-vegetarian') === 'true';
      
      const matchesSearch = name.includes(searchTerm) || 
                          categories.includes(searchTerm) || 
                          address.includes(searchTerm);
      
      const passesVegFilter = !vegOnly || isVeg;
      
      card.style.display = matchesSearch && passesVegFilter ? '' : 'none';
    });
  }

  function filterRestaurantsByCategory(category) {
    restaurantCards.forEach(card => {
      if (category === 'all') {
        card.style.display = '';
      } else {
        const categories = card.getAttribute('data-categories').split(',');
        card.style.display = categories.includes(category) ? '' : 'none';
      }
    });
  }

  function applyVegetarianFilter() {
    const isVegOnly = vegToggle?.checked;
    const searchTerm = searchInput?.value.toLowerCase() || '';
    filterRestaurants(searchTerm, isVegOnly);
  }

  function openRestaurantModal(name, image, isVeg) {
    document.getElementById('modal-name').textContent = name;
    document.getElementById('modal-image').style.backgroundImage = image;
    document.getElementById('modal-veg-indicator').style.display = isVeg ? '' : 'none';
    restaurantModal.classList.remove('hidden');
    restaurantModal.classList.add('active');
  }

  function closeRestaurantModal() {
    restaurantModal.classList.add('hidden');
    restaurantModal.classList.remove('active');
  }

  function switchSection(targetSection) {
    navButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-button[data-section="${targetSection}"]`).classList.add('active');
    
    sections.forEach(section => {
      section.classList.toggle('hidden', !section.id.includes(targetSection));
    });
  }

  function getRestaurantData(card) {
    return {
      id: card.getAttribute('data-id'),
      name: card.querySelector('.restaurant-name').textContent,
      image: card.querySelector('.restaurant-image').style.backgroundImage,
      categories: card.getAttribute('data-categories'),
      address: card.querySelector('.restaurant-address').textContent,
      vegetarian: card.getAttribute('data-vegetarian') === 'true'
    };
  }

  function updateFavoriteUI(button, card, isActive) {
    button.classList.toggle('active', isActive);
    button.textContent = isActive ? '❤' : '♡';
    
    const favoritesSection = document.getElementById('favorites-section');
    const emptyState = favoritesSection.querySelector('.empty-state');
    const restaurantId = card.getAttribute('data-id');
    
    if (isActive) {
      const clonedCard = card.cloneNode(true);
      clonedCard.querySelector('.favorite-button')?.remove();
      favoritesSection.insertBefore(clonedCard, emptyState);
    } else {
      const existingCard = favoritesSection.querySelector(`.restaurant-card[data-id="${restaurantId}"]`);
      existingCard?.remove();
    }
    
    updateEmptyState(favoritesSection, emptyState);
  }

  function updateFavoritesUI(favorites) {
    const favoritesSection = document.getElementById('favorites-section');
    const emptyState = favoritesSection.querySelector('.empty-state');
    
    // Clear current favorites
    favoritesSection.querySelectorAll('.restaurant-card:not(.hidden)').forEach(card => card.remove());
    
    // Update favorite buttons
    restaurantCards.forEach(card => {
      const button = card.querySelector('.favorite-button');
      const restaurantId = card.getAttribute('data-id');
      const isFavorite = favorites.some(fav => fav.id === restaurantId);
      
      button.classList.toggle('active', isFavorite);
      button.textContent = isFavorite ? '❤' : '♡';
    });
    
    // Add favorites to section
    if (favorites.length > 0) {
      favorites.forEach(fav => {
        const originalCard = document.querySelector(`.restaurant-card[data-id="${fav.id}"]`);
        if (originalCard) {
          const clonedCard = originalCard.cloneNode(true);
          clonedCard.querySelector('.favorite-button')?.remove();
          favoritesSection.insertBefore(clonedCard, emptyState);
        }
      });
    }
    
    updateEmptyState(favoritesSection, emptyState);
  }

  function createReservationData(time) {
    return {
      id: Date.now().toString(),
      restaurantName: document.getElementById('modal-name').textContent,
      date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: time,
      partySize: personsCount.textContent
    };
  }

  function addReservationToUI(reservation) {
    const reservationCard = document.createElement('div');
    reservationCard.className = 'reservation-card';
    reservationCard.dataset.id = reservation.id;
    reservationCard.innerHTML = `
      <h3>${reservation.restaurantName}</h3>
      <p>Date: ${reservation.date}</p>
      <p>Time: ${reservation.time}</p>
      <p>Party: ${reservation.partySize}</p>
      <button class="cancel-reservation">Cancel</button>
    `;
    
    const reservationsList = document.getElementById('reservations-list');
    reservationsList.appendChild(reservationCard);
    
    reservationCard.querySelector('.cancel-reservation').addEventListener('click', async function() {
      if (confirm('Are you sure you want to cancel this reservation?')) {
        try {
          const response = await fetch(`${API_BASE_URL}/reservations?user_id=${CURRENT_USER_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'remove', 
              reservation_id: reservation.id 
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              reservationCard.remove();
            }
          }
        } catch (error) {
          console.error('Error cancelling reservation:', error);
        }
      }
    });
  }

  function updateReservationsUI(reservations) {
    const reservationsList = document.getElementById('reservations-list');
    reservationsList.innerHTML = '';
    
    reservations.forEach(reservation => {
      addReservationToUI(reservation);
    });
  }

  function updatePersonsCount() {
    personsCount.textContent = persons + (persons === 1 ? ' person' : ' people');
  }

  function updateEmptyState(section, emptyState) {
    if (!emptyState) return;
    
    const hasItems = section.querySelector('.restaurant-card:not(.hidden)') || 
                    section.querySelector('.reservation-card');
    
    emptyState.style.display = hasItems ? 'none' : '';
  }
});
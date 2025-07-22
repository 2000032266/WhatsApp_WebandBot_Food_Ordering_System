const express = require('express');
const Restaurant = require('../models/Restaurant');

const router = express.Router();

// Get all active restaurants (public endpoint)
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.getAll();
    
    res.json({
      success: true,
      data: {
        restaurants: restaurants || []
      }
    });
  } catch (error) {
    console.error('Public restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants'
    });
  }
});

// Get restaurant menu (public endpoint)
router.get('/restaurants/:id/menu', async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await Restaurant.getMenu(id);
    
    res.json({
      success: true,
      data: {
        menuItems: menu || []
      }
    });
  } catch (error) {
    console.error('Public menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu'
    });
  }
});

// Get restaurant details (public endpoint)
router.get('/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        restaurant
      }
    });
  } catch (error) {
    console.error('Public restaurant details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant details'
    });
  }
});

module.exports = router;

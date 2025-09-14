const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { calculateEmissions, getActivityOptions, getActivityUnit } = require('../utils/emissionsCalculator');

const router = express.Router();

// Get activity options for a category
router.get('/options/:category', (req, res) => {
  const { category } = req.params;
  const options = getActivityOptions(category);
  res.json(options);
});

// Add activity (authenticated users only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category, activityType, amount } = req.body;

    if (!category || !activityType || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Calculate emissions
    const emissions = calculateEmissions(category, activityType, amount);
    const unit = getActivityUnit(category, activityType);

    // Create activity
    const activity = new Activity({
      user: req.user._id,
      category,
      activityType,
      amount,
      unit,
      emissions
    });

    await activity.save();

    // Update user's total emissions and streak
    req.user.totalEmissions += emissions;
    req.user.updateStreak();
    await req.user.save();

    res.status(201).json({
      message: 'Activity added successfully',
      activity: {
        id: activity._id,
        category: activity.category,
        activityType: activity.activityType,
        amount: activity.amount,
        unit: activity.unit,
        emissions: activity.emissions,
        date: activity.date
      }
    });
  } catch (error) {
    console.error('Add activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user activities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const filter = {
      user: req.user._id,
      date: { $gte: startDate }
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    const activities = await Activity.find(filter)
      .sort({ date: -1 })
      .limit(100);

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete activity
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Update user's total emissions
    req.user.totalEmissions = Math.max(0, req.user.totalEmissions - activity.emissions);
    await req.user.save();

    await Activity.findByIdAndDelete(req.params.id);

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get weekly summary
router.get('/weekly-summary', authenticateToken, async (req, res) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const activities = await Activity.find({
      user: req.user._id,
      date: { $gte: startOfWeek }
    });

    const summary = activities.reduce((acc, activity) => {
      const category = activity.category;
      if (!acc[category]) {
        acc[category] = { count: 0, emissions: 0 };
      }
      acc[category].count++;
      acc[category].emissions += activity.emissions;
      return acc;
    }, {});

    const totalEmissions = activities.reduce((sum, activity) => sum + activity.emissions, 0);

    res.json({
      summary,
      totalEmissions,
      activitiesCount: activities.length,
      weekStart: startOfWeek
    });
  } catch (error) {
    console.error('Weekly summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
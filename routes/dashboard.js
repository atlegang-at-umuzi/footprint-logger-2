const express = require('express');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayActivities = await Activity.find({
      user: user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    const todayEmissions = todayActivities.reduce((sum, activity) => sum + activity.emissions, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekActivities = await Activity.find({
      user: user._id,
      date: { $gte: startOfWeek }
    });

    const weekEmissions = weekActivities.reduce((sum, activity) => sum + activity.emissions, 0);

    res.json({
      user: {
        username: user.username,
        totalEmissions: user.totalEmissions,
        streak: user.streak
      },
      today: {
        emissions: todayEmissions,
        activitiesCount: todayActivities.length
      },
      week: {
        emissions: weekEmissions,
        activitiesCount: weekActivities.length
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/community-average', async (req, res) => {
  try {
    const users = await User.find({ totalEmissions: { $gt: 0 } });
    
    if (users.length === 0) {
      return res.json({ average: 0, userCount: 0 });
    }

    const totalEmissions = users.reduce((sum, user) => sum + user.totalEmissions, 0);
    const average = totalEmissions / users.length;

    res.json({
      average: parseFloat(average.toFixed(2)),
      userCount: users.length
    });
  } catch (error) {
    console.error('Community average error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ totalEmissions: { $gt: 0 } })
      .select('username totalEmissions streak')
      .sort({ totalEmissions: 1 })
      .limit(10);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      totalEmissions: parseFloat(user.totalEmissions.toFixed(2)),
      streak: user.streak
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/category-breakdown', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activities = await Activity.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalEmissions: { $sum: '$emissions' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalEmissions: -1 }
      }
    ]);

    const breakdown = activities.map(item => ({
      category: item._id,
      emissions: parseFloat(item.totalEmissions.toFixed(2)),
      count: item.count
    }));

    res.json(breakdown);
  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
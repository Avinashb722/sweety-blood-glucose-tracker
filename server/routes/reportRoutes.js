const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// All report routes require authentication
router.use(authMiddleware);

router.get('/daily', reportController.getDailyReport);
router.get('/month-to-date', reportController.getMonthToDateReport);
router.get('/monthly', reportController.getMonthlyReport);

module.exports = router;


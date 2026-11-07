const express = require('express');
const router = express.Router();
const readingController = require('../controllers/readingController');
const authMiddleware = require('../middleware/authMiddleware');

// All reading routes require authentication
router.use(authMiddleware);

router.post('/', readingController.addReading);
router.get('/', readingController.getReadings);
router.get('/:id', readingController.getReadingById);
router.put('/:id', readingController.updateReading);
router.delete('/:id', readingController.deleteReading);

module.exports = router;


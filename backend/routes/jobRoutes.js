const express = require('express');
const router = express.Router();
const JobController = require('../controllers/jobController');
const { optionalAuth, authenticate } = require('../middleware/authMiddleware');

router.get('/jobs', JobController.getJobs);
router.get('/jobs/my-applications', optionalAuth, JobController.getMyApplications);
router.get('/jobs/:id', JobController.getJobById);
router.post('/jobs/:id/apply', optionalAuth, JobController.applyJob);

module.exports = router;

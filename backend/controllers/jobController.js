const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/helpers');

const JobController = {
  async getJobs(req, res) {
    const { category, district, search, status = 'active' } = req.query;
    const jobs = Job.listAll({ category, district, search, status });
    return successResponse(res, { jobs, count: jobs.length });
  },

  async getJobById(req, res) {
    const { id } = req.params;
    const job = Job.findById(id);
    if (!job) return errorResponse(res, 'Job posting not found', 404);
    return successResponse(res, { job });
  },

  async applyJob(req, res) {
    try {
      const { id } = req.params;
      const { client_id, applicant_name, phone, village, experience, remarks } = req.body;
      const userId = req.user ? req.user.id : (req.body.user_id || 'usr-farmer-001');

      const job = Job.findById(id);
      if (!job || job.status !== 'active') {
        return errorResponse(res, 'This job is no longer accepting applications', 400);
      }

      if (!applicant_name || !phone || !village) {
        return errorResponse(res, 'Applicant name, phone, and village are required.', 400);
      }

      const application = JobApplication.create({
        client_id,
        job_id: id,
        user_id: userId,
        applicant_name,
        phone,
        village,
        experience,
        remarks,
        status: 'submitted',
        sync_status: 'synced'
      });

      Notification.create({
        user_id: userId,
        title: 'Job Application Submitted',
        message: `Your application for "${job.title}" has been forwarded to the employer.`,
        type: 'success'
      });

      return successResponse(res, { application }, 'Job application submitted successfully', 201);
    } catch (err) {
      console.error('[JobController.applyJob]', err);
      return errorResponse(res, 'Failed to apply for job', 500);
    }
  },

  async getMyApplications(req, res) {
    const userId = req.user ? req.user.id : 'usr-farmer-001';
    const applications = JobApplication.listAll({ userId });
    return successResponse(res, { applications });
  }
};

module.exports = JobController;

const issueService = require('../services/issueService');

const createIssue = async (req, res, next) => {
    try {
        const issue = await issueService.createIssue(req.body);

        res.status(201).json({
            success: true,
            data: issue
        });

    } catch (err) {
        next(err);
    }
};

const getIssues = async (req, res, next) => {
    try {

        const result = await issueService.getIssues(req.validatedQuery);

        res.status(200).json({
            success: true,
            data: result.issues,
            pagination: result.pagination
        });


    } catch (err) {
        next(err);
    }
};

module.exports = {
    createIssue,
    getIssues
};
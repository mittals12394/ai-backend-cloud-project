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

const getIssueById = async (req, res, next) => {
    try {
        console.log("reached here");
        
        const issue = await issueService.getIssueById(req.validatedParams.id);

        res.status(200).json({
            success: true,
            data: issue
        });

    } catch (err) {
        next(err);
    }
};

const updateIssue = async (req, res, next) => {
    try{
        const updatedIssue = await issueService.updateIssue(req.validatedParams.id, req.body);

        res.status(200).json({
            success: true,
            data: updatedIssue
        });
    }catch(err){
        next(err);
    }
};

const deleteIssue = async (req, res, next) => {
    try{
        const result = await issueService.deleteIssue(req.validatedParams.id);

        res.status(200).json({
            success: true,
            message: result.message
        });
    }catch(err){
        next(err);
    }
};

module.exports = {
    createIssue,
    getIssues,
    getIssueById,
    updateIssue,
    deleteIssue
};
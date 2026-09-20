const tagService = require("../services/tagService");

const createTag = async (req, res, next) => {
    try {
        const tag = await tagService.createTag(req.body);

        res.status(201).json({
            success: true,
            data: tag
        });

    } catch (err) {
        next(err);
    }
};

const getTags = async (req, res, next) => {
    try {
        const tags = await tagService.getTags();

        res.status(200).json({
            success: true,
            data: tags
        });

    } catch (err) {
        next(err);
    }
};

const getTagById = async (req, res, next) => {
    try {
        const tag = await tagService.getTagById(req.validatedParams.id);

        res.status(200).json({
            success: true,
            data: tag
        });

    } catch (err) {
        next(err);
    }
};

const updateTag = async (req, res, next) => {
    try {
        const tag = await tagService.updateTag(req.validatedParams.id, req.body);

        res.status(200).json({
            success: true,
            data: tag
        });

    } catch (err) {
        next(err);
    }
};

const deleteTag = async (req, res, next) => {
    try {
        await tagService.deleteTag(
            req.validatedParams.id
        );

        res.status(200).json({
            success: true,
            message: 'Tag deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

const addTagToIssue = async (req, res, next) => {
    try {
        const result = await tagService.addTagToIssue(
            Number(req.params.issueId),
            Number(req.params.tagId)
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

const removeTagFromIssue = async (req, res, next) => {
    try {
        
        const result = await tagService.removeTagFromIssue(
            Number(req.params.issueId),
            Number(req.params.tagId)
        );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (err) {
        next(err);
    }
};

module.exports = {
    createTag,
    getTags,
    getTagById,
    updateTag,
    deleteTag,
    addTagToIssue,
    removeTagFromIssue
}
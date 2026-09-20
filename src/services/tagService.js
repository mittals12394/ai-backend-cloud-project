const prisma = require("../config/prisma");

const createTag = async (data) => {

    return prisma.tag.create({
        data: {
            name: data.name
        }
    });

};

const getTags = async () => {

    return prisma.tag.findMany({
        orderBy: {
            name: 'asc'
        }
    });

};

const getTagById = async (id) => {

    const tag = await prisma.tag.findUnique({
        where: { id },

        include: {
            issues: true
        }
    });

    if (!tag) {
        const error = new Error('Tag not found');
        error.status = 404;

        throw error;
    }

    return tag;
};

const updateTag = async (id, data) => {

    return prisma.tag.update({
        where: { id },
        data: {
            name: data.name
        }
    });

};

const deleteTag = async (id) => {

    return prisma.tag.delete({
        where: { id }
    });

};

const addTagToIssue = async (
    issueId,
    tagId
) => {

    const issue = await prisma.issue.findUnique({
        where: {
            id: issueId
        }
    });

    if (!issue) {
        const error = new Error('Issue not found');
        error.status = 404;
        throw error;
    }

    return prisma.issue.update({
        where: {
            id: issueId
        },

        data: {
            tags: {
                connect: {
                    id: tagId
                }
            }
        },

        include: {
            tags: true
        }
    });

};

const removeTagFromIssue = async (
    issueId,
    tagId
) => {

    return prisma.issue.update({
        where: {
            id: issueId
        },

        data: {
            tags: {
                disconnect: {
                    id: tagId
                }
            }
        },

        include: {
            tags: true
        }
    });

};

module.exports = {
    createTag,
    getTags,
    getTagById,
    updateTag,
    deleteTag,
    addTagToIssue,
   removeTagFromIssue
};
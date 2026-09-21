const cacheService = require('./cacheService');

const {
  issueDetailKey,
  issueListPattern
} = require('../utils/cacheKeys');

const invalidateIssueDetail = async (issueId) => {
  await cacheService.deleteKey(issueDetailKey(issueId));
};

const invalidateIssueLists = async () => {
  await cacheService.deleteByPattern(issueListPattern());
};

const invalidateIssueCache = async (issueId) => {
  await Promise.all([
    invalidateIssueDetail(issueId),
    invalidateIssueLists()
  ]);
};

module.exports = {
  invalidateIssueDetail,
  invalidateIssueLists,
  invalidateIssueCache
};
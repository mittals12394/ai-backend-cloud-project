const issueDetailKey = (issueId) => {
  return `issue:${issueId}`;
};

const issueListKey = (query) => {
  const normalizedQuery = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([firstKey], [secondKey]) =>
      firstKey.localeCompare(secondKey)
    );

  return `issues:list:${JSON.stringify(normalizedQuery)}`;
};

const issueListPattern = () => {
  return 'issues:list:*';
};

module.exports = {
  issueDetailKey,
  issueListKey,
  issueListPattern
};
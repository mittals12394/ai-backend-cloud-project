const {
  getSummarizationAdapter
} = require(
  '../adapters/summarization'
);

const summarizeIssue = async (issue) => {
  if (!issue) {
    throw new Error(
      'Issue is required for summarization'
    );
  }

  const adapter =
    getSummarizationAdapter();

  const result =
    await adapter.summarize({
      issue
    });

  if (
    !result ||
    !result.content
  ) {
    throw new Error(
      'Summarization adapter returned no content'
    );
  }

  return result;
};

module.exports = {
  summarizeIssue
};
const heuristicAdapter = require(
  './heuristicSummarizationAdapter'
);

const resilientAdapter = require(
  './resilientSummarizationAdapter'
);

const getSummarizationAdapter = () => {
  const provider = (
    process.env
      .SUMMARIZATION_PROVIDER ||
    'heuristic'
  ).toLowerCase();

  switch (provider) {
    case 'huggingface':
      return resilientAdapter;

    case 'heuristic':
      return heuristicAdapter;

    default:
      throw new Error(
        `Unsupported summarization provider: ${provider}`
      );
  }
};

module.exports = {
  getSummarizationAdapter
};
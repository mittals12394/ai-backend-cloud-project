const CircuitBreaker =
  require('opossum');

const logger =
  require('../../utils/logger');

const heuristicAdapter =
  require('./heuristicSummarizationAdapter');

const huggingFaceAdapter =
  require('./huggingFaceSummarizationAdapter');

const AI_TIMEOUT_MS = Number(
  process.env.AI_TIMEOUT_MS || 15000
);

const CIRCUIT_ERROR_THRESHOLD = Number(
  process.env
    .AI_CIRCUIT_ERROR_THRESHOLD || 50
);

const CIRCUIT_RESET_TIMEOUT_MS = Number(
  process.env
    .AI_CIRCUIT_RESET_TIMEOUT_MS ||
    30000
);

const executeProvider = async (input) => {
  return huggingFaceAdapter.summarize(
    input
  );
};

const breaker = new CircuitBreaker(
  executeProvider,
  {
    timeout: AI_TIMEOUT_MS,

    errorThresholdPercentage:
      CIRCUIT_ERROR_THRESHOLD,

    resetTimeout:
      CIRCUIT_RESET_TIMEOUT_MS,

    volumeThreshold: Number(
      process.env
        .AI_CIRCUIT_VOLUME_THRESHOLD ||
        3
    ),

    name:
      'hugging-face-summarization'
  }
);

breaker.fallback(async (input) => {
  logger.warn(
    'AI summarization fallback activated',
    {
      issueId: input.issue.id
    }
  );

  const result =
    await heuristicAdapter.summarize(
      input
    );

  return {
    ...result,

    metadata: {
      ...result.metadata,

      fallback: true,

      primaryProvider:
        'huggingface'
    }
  };
});

breaker.on('open', () => {
  logger.error(
    'AI summarization circuit opened',
    {
      provider: 'huggingface'
    }
  );
});

breaker.on('halfOpen', () => {
  logger.warn(
    'AI summarization circuit half-open',
    {
      provider: 'huggingface'
    }
  );
});

breaker.on('close', () => {
  logger.info(
    'AI summarization circuit closed',
    {
      provider: 'huggingface'
    }
  );
});

breaker.on('timeout', () => {
  logger.error(
    'AI summarization request timed out',
    {
      provider: 'huggingface',
      timeoutMs: AI_TIMEOUT_MS
    }
  );
});

breaker.on('reject', () => {
  logger.warn(
    'AI summarization request rejected by open circuit',
    {
      provider: 'huggingface'
    }
  );
});

breaker.on('failure', (error) => {
  logger.error(
    'AI summarization provider failed',
    {
      provider: 'huggingface',
      error: error.message
    }
  );
});

const summarize = async (input) => {
  return breaker.fire(input);
};

const getCircuitStatus = () => {
  const snapshot = breaker.toJSON();

  return {
    state: snapshot.state,
    status: snapshot.status
  };
};

module.exports = {
  summarize,
  getCircuitStatus
};
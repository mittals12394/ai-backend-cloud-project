const {
  HfInference
} = require('@huggingface/inference');

const HF_MODEL =
  process.env.HF_SUMMARIZATION_MODEL ||
  'facebook/bart-large-cnn';

let hfClient;

const getClient = () => {
  if (!process.env.HF_TOKEN) {
    const error = new Error(
      'HF_TOKEN is not configured'
    );

    error.code =
      'HF_CONFIGURATION_ERROR';

    throw error;
  }

  if (!hfClient) {
    hfClient = new HfInference(
      process.env.HF_TOKEN
    );
  }

  return hfClient;
};

const buildInputText = (issue) => {
  const tags =
    issue.tags.length > 0
      ? issue.tags
          .map((tag) => tag.name)
          .join(', ')
      : 'None';

  const logText = issue.logs
    .map((log) => log.rawText)
    .filter(Boolean)
    .join('\n')
    .slice(
      0,
      Number(
        process.env.AI_MAX_INPUT_CHARS ||
        12000
      )
    );

  return `
Issue title: ${issue.title}
Description: ${
    issue.description ||
    'No description provided'
  }
Status: ${issue.status}
Severity: ${issue.severity}
Tags: ${tags}

Logs:
${logText || 'No logs available'}
`.trim();
};

const summarize = async (input) => {
  const client = getClient();

  const text = buildInputText(
    input.issue
  );

  if (!text) {
    throw new Error(
      'No input was available for summarization'
    );
  }

  const result =
    await client.summarization({
      model: HF_MODEL,

      inputs: text,

      parameters: {
        max_length: Number(
          process.env.HF_SUMMARY_MAX_LENGTH ||
          220
        ),

        min_length: Number(
          process.env.HF_SUMMARY_MIN_LENGTH ||
          40
        )
      }
    });

  const content =
    result?.summary_text?.trim();

  if (!content) {
    const error = new Error(
      'Hugging Face returned an empty summary'
    );

    error.code =
      'EMPTY_AI_RESPONSE';

    throw error;
  }

  return {
    content,

    provider: 'huggingface',

    metadata: {
      model: HF_MODEL,
      inputCharacters: text.length
    }
  };
};

module.exports = {
  summarize
};
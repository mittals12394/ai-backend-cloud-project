const extractErrorLines = (logs) => {
  const allLines = logs.flatMap((log) => {
    if (!log.rawText) {
      return [];
    }

    return log.rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  });

  const errorLines = allLines.filter((line) => {
    const normalizedLine = line.toLowerCase();

    return (
      normalizedLine.includes('error') ||
      normalizedLine.includes('exception') ||
      normalizedLine.includes('failed') ||
      normalizedLine.includes('failure') ||
      normalizedLine.includes('timeout') ||
      normalizedLine.includes('fatal')
    );
  });

  return {
    allLines,
    errorLines,
    topErrors: [...new Set(errorLines)].slice(0, 5)
  };
};

const buildSummary = (issue, analysis) => {
  const tags =
    issue.tags.length > 0
      ? issue.tags
          .map((tag) => tag.name)
          .join(', ')
      : 'No tags';

  const topErrors =
    analysis.topErrors.length > 0
      ? analysis.topErrors
          .map(
            (errorLine, index) =>
              `${index + 1}. ${errorLine}`
          )
          .join('\n')
      : 'No error lines were detected.';

  return `
Issue Summary

Issue:
${issue.title}

Description:
${issue.description || 'No description provided'}

Status:
${issue.status}

Severity:
${issue.severity}

Tags:
${tags}

Total Log Lines:
${analysis.allLines.length}

Error Count:
${analysis.errorLines.length}

Top Error Lines:
${topErrors}
`.trim();
};

const summarize = async (input) => {
  const analysis = extractErrorLines(
    input.issue.logs
  );

  return {
    content: buildSummary(
      input.issue,
      analysis
    ),

    provider: 'heuristic',

    metadata: {
      totalLines:
        analysis.allLines.length,

      totalErrors:
        analysis.errorLines.length
    }
  };
};

module.exports = {
  summarize
};
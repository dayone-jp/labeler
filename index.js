import core from "@actions/core";
import github from "@actions/github";

const isAdd = (set) => set === "true";
const isRemove = (set) => !isAdd(set);

try {
  const oktokit = github.getOctokit(process.env.GITHUB_TOKEN);
  const set = core.getInput("set");
  const label = core.getInput("label");

  console.log(`set: ${set}`);
  console.log(`label: "${label}"`);

  const prNumber = github.context.payload.pull_request.number;

  const hasLabel = async () => {
    const labels = await oktokit.request(
      "GET /repos/{owner}/{repo}/issues/{issue_number}/labels",
      {
        ...github.context.repo,
        issue_number: prNumber,
      }
    );
    const hasLabel = labels.data.some((l) => l.name === label);
    console.log(
      hasLabel
        ? `PR #${prNumber} has label ${label}; ${
            isRemove(set) ? "proceeding..." : "skip..."
          }`
        : `PR #${prNumber} does not have label ${label}; ${
            isAdd(set) ? "proceeding..." : "skip..."
          }`
    );
    return labels.data.some((l) => l.name === label);
  };

  const removeLabel = async () => {
    console.log(`Removing label "${label}" from PR #${prNumber}`);
    if (await hasLabel()) {
      await oktokit.request(
        "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{label}",
        {
          ...github.context.repo,
          issue_number: prNumber,
          label,
        }
      );
    }
  };

  const addLabel = async () => {
    console.log(`Adding label "${label}" to PR #${prNumber}`);
    if (!(await hasLabel())) {
      await oktokit.request(
        "POST /repos/{owner}/{repo}/issues/{issue_number}/labels",
        {
          ...github.context.repo,
          issue_number: prNumber,
          labels: [label],
        }
      );
    }
  };

  await (set === "true" ? addLabel() : removeLabel());
} catch (error) {
  core.setFailed(error.message);
}

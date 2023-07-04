import { postIngestion } from "./ingestion";
import { execa, getSchemaPath, isGithubPR } from "./utils";

async function run() {
  const schemaPath = await getSchemaPath();
  console.log("Using schemaPath: ", schemaPath);

  await setupGitForIngestion();

  const res = await postIngestion(schemaPath);
  console.log(res);
}

run();

async function setupGitForIngestion() {
  // We don't support merge commits right now so we need to make sure
  // that the latest commit is a regular commit, and if not revert the merge
  // commit.

  // Get the latest commit
  const { stdout } = await execa("git log -1 --format='%H'");

  // Get the parent commit
  const { stdout: parentStdout } = await execa("git log -1 --format='%P'");
  const parentHashes = parentStdout.trim().split(" ").filter(Boolean);

  if (parentHashes.length > 1) {
    const parentHash = parentHashes.pop();

    if (isGithubPR()) {
      console.log(
        "Detected merge commit when running with pull_request context. Reverting to parent commit before uploading."
      );
      await execa(`git reset --hard ${parentHash}`);
      await execa("git checkout -");
      return;
    }

    // Merge commit - reset it
    console.warn(
      "We detected that the latest commit is a merge commit. We don't support merge commits right now so we're going to reset the commit to the parent commit, before uploadthing your schema. Don't worry, this reset will not be pushed to the repo."
    );
    await execa(`git reset --hard ${parentHash}`);
    await execa("git checkout -");
  }
}

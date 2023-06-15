import * as core from "@actions/core";
import * as gh from "@actions/github";
import type { getOctokit } from "@actions/github";

const OWNER = gh.context.repo.owner;
const REPO = gh.context.repo.repo;
const ISSUE_NR = gh.context.issue.number;

type Octokit = ReturnType<typeof getOctokit>;

export async function get(opts: { octokit: Octokit; searchFor: string }) {
  const { octokit } = opts;

  const { data: comments } = await octokit.rest.issues.listComments({
    issue_number: ISSUE_NR,
    owner: OWNER,
    repo: REPO,
  });

  console.log({ comments });

  const comment = comments.find((comment) =>
    comment.body.includes(opts.searchFor)
  );
  if (!comment) return undefined;

  return { id: comment?.id, body: comment?.body };
}

export async function create(opts: { octokit: Octokit; body: string }) {
  const { octokit, body } = opts;

  await octokit.rest.issues.createComment({
    issue_number: ISSUE_NR,
    owner: OWNER,
    repo: REPO,
    body,
  });
}

export async function update(opts: {
  octokit: Octokit;
  id: number;
  body: string;
}) {
  const { octokit, id, body } = opts;

  await octokit.rest.issues.updateComment({
    comment_id: id,
    owner: OWNER,
    repo: REPO,
    body,
  });
}

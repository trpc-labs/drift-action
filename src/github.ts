import * as gh from "@actions/github";
import * as core from "@actions/core";
import { getOctokit } from "./utils";

export async function getFileContent(path: string, ref?: string) {
  const octokit = getOctokit();

  const response = await octokit.rest.repos.getContent({
    owner: gh.context.repo.owner,
    repo: gh.context.repo.repo,
    path,
    ref: ref ?? "main",
  });

  if (Array.isArray(response.data) || !("content" in response.data)) {
    core.setFailed(
      "Unexpected response from Github API. Expected file with content, got array"
    );
    return;
  }

  return Buffer.from(
    response.data.content,
    response.data.encoding as BufferEncoding
  ).toString();
}

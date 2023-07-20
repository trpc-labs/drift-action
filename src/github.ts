import * as gh from "@actions/github";
import * as core from "@actions/core";
import { getOctokit } from "./utils";
import * as fs from "node:fs";

/**
 * @deprecated
 * Could be removed, nice reference to have though
 */
export async function getFileContentFromRepo(path: string, ref?: string) {
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


export function getFileContentFromFilesystem(path: string): string {
  return fs.readFileSync(path, { encoding: "utf-8" }).toString();
}

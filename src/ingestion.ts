import { execa, getPullRequestNumber } from "./utils";
import { fetch, FormData } from "undici";
import { blob } from "node:stream/consumers";
import { basename } from "node:path";
import { createReadStream } from "node:fs";

import { getApiKey, getUrl } from "./utils";

export async function postIngestion(schemaPath: string) {
  const formData = new FormData();

  const fileStream = createReadStream(schemaPath);
  const fileBlob = await blob(fileStream);
  const fileName = basename(schemaPath);

  console.log("Debugging git info");
  console.log((await execa("git log -5 --pretty=full")).stdout);

  formData.append("schema", fileBlob, fileName);
  formData.append("commitHash", await getCommitHash());
  formData.append("parentHash", await getParentHash());
  formData.append("treeHash", await getTreeHash());
  formData.append("pullRequestNumber", getPullRequestNumber() ?? "");
  formData.append("commitMessage", await getCommitMessage());
  formData.append("branchName", await getBranchName());
  formData.append("branchRef", await getBranchRef());
  formData.append("commitAuthor", await getCommitAuthor());
  formData.append("authorEmail", await getCommitAuthorEmail());

  console.log("Posting ingestion");
  console.log(formData);

  const url = getUrl();
  const apiKey = getApiKey();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-acme-api-key": apiKey,
      //   "Content-Type": "multipart/form-data;",
    },
    body: formData,
  });

  // Handle the response
  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    return {
      status: response.status,
      message: response.statusText,
    };
  }
}

// Helper functions to get Git metadata
async function getCommitHash(): Promise<string> {
  const { stdout } = await execa('git log -1 --format="%H"');
  return stdout.trim();
}

async function getParentHash(): Promise<string | null> {
  const { stdout } = await execa('git log -1 --format="%P"');
  return stdout.trim() || null;
}

async function getBranchName(): Promise<string> {
  const { stdout } = await execa("git rev-parse --abbrev-ref HEAD");
  return stdout.trim();
}

async function getBranchRef(): Promise<string> {
  const { stdout } = await execa("git symbolic-ref HEAD").catch(() => {
    return execa("git rev-parse HEAD");
  });
  return stdout.trim();
}

async function getCommitMessage(): Promise<string> {
  const { stdout } = await execa('git log -1 --format="%s"');
  return stdout.trim();
}

async function getCommitAuthor(): Promise<string> {
  const { stdout } = await execa('git log -1 --format="%an"');
  return stdout.trim();
}

async function getCommitAuthorEmail(): Promise<string> {
  const { stdout } = await execa('git log -1 --format="%ae"');
  return stdout.trim();
}

async function getTreeHash(): Promise<string> {
  const { stdout } = await execa('git log -1 --format="%T"');
  return stdout.trim();
}

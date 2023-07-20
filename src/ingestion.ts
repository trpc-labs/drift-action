import { execa, getPullRequestNumber, isLocalDev } from "./utils";
import { fetch, FormData } from "undici";
import { blob } from "node:stream/consumers";
import { basename } from "node:path";
import { createReadStream } from "node:fs";
import * as gh from "@actions/github";
import { getApiKey, getUrl } from "./utils";
import { get } from "node:http";
import * as fs from "node:fs"

export async function postIngestion(configDir: string, schemaPath: string) {
  const formData = new FormData();

  // Getting schema
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath} - maybe you need to generate it?`)
  }

  const fileBlob = await blob(createReadStream(schemaPath));
  const fileName = basename(schemaPath);

  console.log("Debugging git info");
  console.log((await execa("git log -5 --pretty=full")).stdout);

  console.log("Github context");
  console.log(gh.context.payload.pull_request);

  console.log("Other github info");
  console.log(gh.context);
  console.log(gh.context.payload);

  // Schema file
  formData.append("schema", fileBlob, fileName);

  // General git metadata
  formData.append("commitHash", await getCommitHash());
  formData.append("parentHash", await getParentHash());
  formData.append("treeHash", await getTreeHash());
  formData.append("commitMessage", await getCommitMessage());
  formData.append("commitAuthor", await getCommitAuthor());
  formData.append("authorEmail", await getCommitAuthorEmail());

  // metadata that's different for commit and PRs
  formData.append("branchName", await getBranchName());
  formData.append("branchRef", await getBranchRef());
  formData.append("baseBranchRef", getBaseBranchRef());
  formData.append("pullRequestNumber", getPullRequestNumber() ?? "");
  formData.append("pullRequestTitle", getPullRequestTitle() ?? "");
  formData.append("pullRequestAuthor", getPullRequestAuthor() ?? "");
  formData.append("pullRequestCommitCount", getPullRequestCommitCount() ?? "");

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
  if (stdout.trim() === "HEAD") {
    return gh.context.payload.pull_request?.head.ref as string;
  }
  return stdout.trim();
}

async function getBranchRef(): Promise<string> {
  const { stdout } = await execa("git symbolic-ref HEAD").catch(() => {
    return {
      stdout: gh.context.payload.pull_request?.head.ref,
    };
  });
  return stdout.trim();
}

function getBaseBranchRef() {
  if (isLocalDev) {
    return null;
  }
  return gh.context.payload.pull_request?.base.ref ?? null;
}

function getPullRequestTitle() {
  if (isLocalDev) {
    return null;
  }
  return gh.context.payload.pull_request?.title ?? null;
}

function getPullRequestAuthor() {
  if (isLocalDev) {
    return null;
  }
  return gh.context.payload.pull_request?.user.login ?? null;
}

function getPullRequestCommitCount() {
  if (isLocalDev) {
    return null;
  }
  return gh.context.payload.pull_request?.commits ?? null;
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

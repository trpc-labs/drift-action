import * as core from "@actions/core";
import * as gh from "@actions/github";
import { exec } from "node:child_process";
import * as path from "node:path";
import { promisify } from "node:util";
import { getFileContentFromFilesystem } from "./github";
import { parseTrpcConfig } from "./trpc-config";

export const execa = promisify(exec);

export const isLocalDev = process.env.npm_lifecycle_event === "local-run";

export function getApiKey() {
  if (isLocalDev) {
    return process.env.API_KEY;
  }

  const apiKey = core.getInput("API_KEY");
  if (!apiKey) {
    core.setFailed("API_KEY is required");
    return;
  }
  return apiKey;
}

export function getOctokit() {
  const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");
  if (!GITHUB_TOKEN) {
    // should not happen, it's set to required in the action.yml
    core.setFailed("GITHUB_TOKEN is required");
    return;
  }
  return gh.getOctokit(GITHUB_TOKEN);
}

export function getUrl() {
  const baseUrl = isLocalDev
    ? "http://localhost:3000"
    : "https://trpc-drift-dashboard-nextjs.vercel.app";
  return baseUrl + "/api/trpc/lambda/ingestion.upload";
}

export async function getSchemaPath() {
  if (isLocalDev) {
    return {
      configDir: "../example-t3-app",
      // schemaPath: "../example-t3-app/trpc/schema.json",
      schemaPath: "../../cal.com/packages/trpc/trpc/schema.json",
    };
  }

  const configPath = core.getInput("TRPC_CONFIG_PATH");
  const configDir = path.dirname(configPath);
  const trpcConfig = getFileContentFromFilesystem(configPath);
  const schemaPath = parseTrpcConfig(trpcConfig).schemaPath;
  return { configDir, schemaPath: path.join(configDir, schemaPath) };
}

export function getPullRequestNumber() {
  if (isLocalDev) {
    return null;
  }

  return gh.context.issue.number ?? null;
}

export function isGithubPR() {
  if (isLocalDev) {
    return false;
  }
  return !!gh.context.payload.pull_request;
}

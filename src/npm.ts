import * as fs from "fs";
import { execa } from "./utils";

function getPackageManager() {
  const pnpmLock = fs.existsSync("pnpm-lock.yaml");
  if (pnpmLock) {
    return "pnpm";
  }

  const yarnLock = fs.existsSync("yarn.lock");
  if (yarnLock) {
    return "yarn";
  }

  const npmLock = fs.existsSync("package-lock.json");
  if (npmLock) {
    return "npm";
  }

  return "npm";
}

export async function executeCommand(command: string, cwd?: string) {
  const pkgManager = getPackageManager();

  if (pkgManager === "pnpm") {
    command = "pnpm " + command;
  }

  if (pkgManager === "yarn") {
    return `yarn ${command}`;
  }

  if (pkgManager === "npm") {
    command = `npx ${command}`;
  }

  await execa(command, { cwd });
}

# Action for checking your schema

## Usage

1. Generate an API Key from the project's dashboard.
2. Create a workflow like this:

```yaml
name: Check Schema

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2.2.4
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Upload schema
        uses: trpc-labs/action
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          API_KEY: ${{ secrets.DRIFT_API_KEY }}
```

## Development

If you have the dashboard running locally on port 3000, you can simulate an action run using

```bash
API_KEY=... pnpm local-run
```

Before commiting‚ make sure to run `pnpm build` to compile the workflow to a single executable. You can also run `pnpm dev` and it will build automatically on changes.

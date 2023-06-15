import { postIngestion } from "./ingestion";
import { getSchemaPath } from "./utils";

async function run() {
  const schemaPath = await getSchemaPath();
  console.log("Using schemaPath: ", schemaPath);

  const res = await postIngestion(schemaPath);
  console.log(res);
}

run();

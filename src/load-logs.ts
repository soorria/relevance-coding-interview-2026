import fs from "fs";
import path from "path";

const directoryPath = path.join(__dirname, "logs");

export function loadAllLogs(): unknown {
  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    const fullPath = path.join(directoryPath, file);
    console.log("Processing file:", fullPath);
    const content = fs.readFileSync(fullPath, "utf-8");
  }

  return [];
}

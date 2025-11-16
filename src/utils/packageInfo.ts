import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

export async function getPackageVersion(): Promise<string> {
  try {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

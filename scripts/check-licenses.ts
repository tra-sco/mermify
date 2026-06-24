import fs from 'fs';
import path from 'path';

// Setup paths
const projectRoot = path.resolve(import.meta.dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const nodeModulesPath = path.join(projectRoot, 'node_modules');
const reportPath = path.join(projectRoot, 'license-report.md');

// Define approved permissive licenses
const ALLOWED_LICENSES = new Set([
  'MIT',
  'APACHE-2.0',
  'BSD-3-CLAUSE',
  'BSD-2-CLAUSE',
  'ISC',
  'CC0-1.0',
  'UNLICENSE',
  'ZLIB',
  '0BSD',
  'PUBLIC DOMAIN',
  'WTFPL',
  'OFL-1.1'
]);

// Known overrides for packages that are permissive but missing correct metadata in package.json
const LICENSE_OVERRIDES: Record<string, string> = {
  'khroma': 'MIT',
  'mermify': 'MIT' // Current project root
};

// Help helper to resolve package.json for nested dependencies
function getPackageJson(depName: string, fromDir: string) {
  const searchPaths = [
    path.join(nodeModulesPath, depName, 'package.json'),
    path.join(fromDir, 'node_modules', depName, 'package.json'),
    path.join(projectRoot, 'node_modules', depName, 'package.json')
  ];
  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      return { path: p, content: JSON.parse(fs.readFileSync(p, 'utf8')) };
    }
  }
  
  // Try Node resolution-like lookup ascending from fromDir
  let currentDir = fromDir;
  while (currentDir !== path.dirname(currentDir)) {
    const checkPath = path.join(currentDir, 'node_modules', depName, 'package.json');
    if (fs.existsSync(checkPath)) {
      return { path: checkPath, content: JSON.parse(fs.readFileSync(checkPath, 'utf8')) };
    }
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

// Check if a single normalized license tag is approved
function isSingleLicenseApproved(license: string): boolean {
  const cleaned = license.toUpperCase().trim();
  // Strip starting/ending quotes and parenthesis
  const normalized = cleaned.replace(/^['"(]+|['")]+$/g, '');
  return ALLOWED_LICENSES.has(normalized);
}

// Parse complex expressions like "(MIT AND Zlib)" or "(MPL-2.0 OR Apache-2.0)"
function checkLicenseExpression(expression: string): boolean {
  const normalized = expression.toUpperCase().trim();
  
  // Handle OR expressions (at least one must be approved)
  if (normalized.includes(' OR ')) {
    const parts = normalized.split(/\s+OR\s+/);
    return parts.some(part => checkLicenseExpression(part));
  }
  
  // Handle AND expressions (all must be approved)
  if (normalized.includes(' AND ')) {
    const parts = normalized.split(/\s+AND\s+/);
    return parts.every(part => checkLicenseExpression(part));
  }
  
  return isSingleLicenseApproved(normalized);
}

interface PackageReport {
  name: string;
  version: string;
  license: string;
  approved: boolean;
  notes: string;
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const productionDeps = Object.keys(packageJson.dependencies || {});

const visited = new Map<string, PackageReport>();

function scan(depName: string, fromDir: string) {
  const resolved = getPackageJson(depName, fromDir);
  if (!resolved) {
    console.warn(`⚠️ Could not resolve package.json for dependency: ${depName} from ${fromDir}`);
    return;
  }
  
  const { path: jsonPath, content: pkg } = resolved;
  const key = `${pkg.name}@${pkg.version}`;
  if (visited.has(key)) {
    return;
  }
  
  let license = pkg.license;
  let notes = '';
  
  // Handle dual licenses / old formats
  if (!license && pkg.licenses) {
    if (Array.isArray(pkg.licenses)) {
      license = pkg.licenses.map((l: any) => l.type || l).join(' OR ');
    } else {
      license = pkg.licenses.type || pkg.licenses;
    }
  }
  
  // Apply overrides
  if (LICENSE_OVERRIDES[pkg.name]) {
    license = LICENSE_OVERRIDES[pkg.name];
    notes = 'Override applied (verified upstream)';
  }
  
  let licenseStr = 'UNKNOWN';
  if (license) {
    licenseStr = typeof license === 'object' ? JSON.stringify(license) : String(license);
  }
  
  const approved = checkLicenseExpression(licenseStr);
  
  visited.set(key, {
    name: pkg.name,
    version: pkg.version,
    license: licenseStr,
    approved,
    notes
  });
  
  // Recursively scan dependencies of this package
  const deps = Object.keys(pkg.dependencies || {});
  for (const subDep of deps) {
    scan(subDep, path.dirname(jsonPath));
  }
}

// Scan all production dependencies
for (const dep of productionDeps) {
  scan(dep, projectRoot);
}

const results = Array.from(visited.values()).sort((a, b) => a.name.localeCompare(b.name));
const disapproved = results.filter(r => !r.approved);

// Generate Markdown report
let md = `# Dependency License Report\n\n`;
md += `Generated on: ${new Date().toISOString()}\n\n`;
md += `## Summary\n\n`;
md += `- **Total dependencies scanned**: ${results.length}\n`;
md += `- **Approved (Permissive)**: ${results.length - disapproved.length}\n`;
md += `- **Requires Review**: ${disapproved.length}\n\n`;

if (disapproved.length > 0) {
  md += `> [!WARNING]\n`;
  md += `> **Non-compliant or unrecognized licenses found!** Make sure you address these before distributing the project.\n\n`;
  
  md += `### Review Required Packages\n\n`;
  md += `| Package | Version | License | Notes |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  for (const item of disapproved) {
    md += `| \`${item.name}\` | ${item.version} | **\`${item.license}\`** | ${item.notes || 'No permissive license match'} |\n`;
  }
  md += `\n`;
} else {
  md += `> [!NOTE]\n`;
  md += `> All production dependencies comply with permissive licenses. Under the current setup, hosting on GitHub Pages is safe and complies with the project's MIT license goal.\n\n`;
}

md += `## Detailed Packages List\n\n`;
md += `| Package | Version | License | Status | Notes |\n`;
md += `| :--- | :--- | :--- | :--- | :--- |\n`;
for (const item of results) {
  const status = item.approved ? '✅ Approved' : '❌ Review Required';
  md += `| \`${item.name}\` | ${item.version} | \`${item.license}\` | ${status} | ${item.notes} |\n`;
}

fs.writeFileSync(reportPath, md, 'utf8');

console.log(`\nLicense verification completed!`);
console.log(`- Scanned: ${results.length} dependencies`);
console.log(`- Approved: ${results.length - disapproved.length}`);
console.log(`- Requires Review: ${disapproved.length}`);
console.log(`Detailed report written to: ${reportPath}\n`);

if (disapproved.length > 0) {
  console.error(`❌ License Check Failed: ${disapproved.length} non-compliant packages detected!`);
  process.exit(1);
} else {
  console.log(`✅ License Check Passed: All dependencies compliant.`);
  process.exit(0);
}

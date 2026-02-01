import { existsSync, readFileSync } from 'node:fs';
import { XMLParser, XMLValidator } from 'fast-xml-parser';


const xmlParserOptions = {
	ignoreAttributes: false,
	attributeNamePrefix: ``,
	allowBooleanAttributes: true,
	trimValues: true,
	parseAttributeValue: false,
	parseTagValue: false
};


export type ResourceNode = Record<string, unknown>;
export type MTAServerConfConfig = Record<string, unknown> & {
	resource: ResourceNode[];
};


export function parseServerConf(confPath: string): MTAServerConfConfig {
	if (!existsSync(confPath)) {
		throw new Error(`[ERR] Configuration file not found: ${confPath}`);
	}

	const xmlContent = readFileSync(confPath, `utf8`);
	const validation = XMLValidator.validate(xmlContent);

	if (validation !== true) {
		const reason = validation.err.msg || String(validation);
		throw new Error(`[ERR] Invalid XML in ${confPath}: ${reason}`);
	}

	const parser = new XMLParser(xmlParserOptions);
	const parsed = parser.parse(xmlContent) as { config?: Record<string, unknown>; };

	if (!parsed.config || (typeof parsed.config !== `object`)) {
		throw new Error(`[ERR] Invalid configuration ${confPath}: root <config> node is missing or invalid`);
	}

	const normalized: MTAServerConfConfig = { resource: [] };
	const config = parsed.config;

	for (const [key, value] of Object.entries(config)) {
		if (key === `resource`) {
			const resourceArray = Array.isArray(value) ? value : (typeof value === `undefined`) ? [] : [value];
			const sanitized: ResourceNode[] = [];

			resourceArray.forEach((entry, idx) => {
				if (!entry || (typeof entry !== `object`)) {
					console.warn(`[WARN] Skipping resource #${idx} because it is not an object.`);
					return;
				}

				const resourceName = entry.src;

				if (typeof resourceName !== `string`) {
					console.warn(`[WARN] Skipping resource #${idx} because "src" is missing or not a string.`);
					return;
				}

				const warning = isResourceNameInvalid(resourceName);

				if (warning) {
					console.warn(warning);
					return;
				}

				sanitized.push(entry as ResourceNode);
			});

			normalized.resource = sanitized;
		} else if (Array.isArray(value)) {
			normalized[key] = value[0];
		} else {
			normalized[key] = value;
		}
	}

	return normalized;
}

function isResourceNameInvalid(name: string): string | void {
	if (!name.trim()) {
		return `[WARN] Skipping resource with empty name.`;
		
	} else if (name.includes(`/`) || name.includes(`\\`)) {
		return `[WARN] Skipping resource "${name}" because its name contains slashes. MTA requires ASCII names without spaces.`;
		
	} else if (name.includes(`..`)) {
		return `[WARN] Skipping resource "${name}" because its name contains "..". MTA requires ASCII names without spaces.`;

	} else if (/\s/.test(name)) {
		return `[WARN] Skipping resource "${name}" because its name contains spaces. MTA requires ASCII names without spaces.`;

	} else if (/[^\x00-\x7F]/.test(name)) {
		return `[WARN] Skipping resource "${name}" because its name uses non-ASCII characters. MTA requires ASCII names without spaces.`;
	}
}